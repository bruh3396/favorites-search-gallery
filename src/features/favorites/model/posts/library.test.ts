import { afterEach, describe, expect, test, vi } from "vitest";
import { MemoryClient } from "@/adapters/memory/client/client";
import { MemoryLocalPosts } from "@/adapters/memory/ports/local_posts/local_posts";
import { MemoryRemotePosts } from "@/adapters/memory/ports/remote_posts/remote_posts";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { Post } from "@/core/domain/post/post";
import { FavoritesPostLibrary } from "@/features/favorites/model/posts/library";
import { RemoteMedia } from "@/core/boundary/ports/remote_media";
import { createPost } from "@/testing/post";

const WRITE_DELAY = 2_000;
const WRITE_BATCH_SIZE = 25;
const UNTIMED_VIDEO: Partial<Post> = { media: { kind: "video", locator: "" }, durationSeconds: 0 };
const DIMENSIONS: Partial<Post> = { width: 100, height: 100 };
const DAY = 24 * 60 * 60 * 1_000;
const NOW = 100 * DAY;

function setup(remotePosts: Post[] = [], fetchDurationSeconds: RemoteMedia["fetchDurationSeconds"] = () => Promise.resolve(12)): {
  library: FavoritesPostLibrary;
  localPosts: MemoryLocalPosts;
  scheduler: MemoryScheduler;
  fetchDurationSeconds: ReturnType<typeof vi.fn<RemoteMedia["fetchDurationSeconds"]>>;
  onRefreshed: ReturnType<typeof vi.fn>;
} {
  const localPosts = new MemoryLocalPosts();
  const scheduler = new MemoryScheduler(NOW);
  const fetchDuration = vi.fn(fetchDurationSeconds);
  const onRefreshed = vi.fn();
  const library = new FavoritesPostLibrary({
    localPosts,
    remotePosts: new MemoryRemotePosts(new MemoryClient(remotePosts)),
    remoteMedia: { fetchDurationSeconds: fetchDuration },
    scheduler,
    onRefreshed
  });
  return { library, localPosts, scheduler, fetchDurationSeconds: fetchDuration, onRefreshed };
}

async function storedIdsOf(localPosts: MemoryLocalPosts, ids: string[]): Promise<string[]> {
  return (await localPosts.getMany(ids)).map(post => post.id);
}

describe("FavoritesPostLibrary", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("streams stored posts in batches of the given size", async() => {
    const { library, localPosts } = setup();
    const batches: string[][] = [];

    await localPosts.setMany(["1", "2", "3"].map(id => createPost({ id })));
    await library.streamAll(["1", "2", "3"], 2, posts => batches.push(posts.map(post => post.id)));

    expect(batches).toEqual([["1", "2"], ["3"]]);
  });

  test("stores only posts that are not already stored", async() => {
    const { library, localPosts } = setup();

    await localPosts.setMany([createPost({ id: "1", score: 5 })]);
    await library.storeMissing([createPost({ id: "1", score: 0 }), createPost({ id: "2" })]);

    expect((await localPosts.getMany(["1", "2"])).map(post => post.score)).toEqual([5, 0]);
  });

  test("leaves a fresh post alone", async() => {
    const { library, onRefreshed } = setup([createPost({ ...DIMENSIONS, score: 9 })]);

    await library.refreshAll([createPost({ fetchedAt: NOW })]);

    expect(onRefreshed).not.toHaveBeenCalled();
  });

  test("leaves a post fetched within 28 days alone", async() => {
    const { library, onRefreshed } = setup([createPost(DIMENSIONS)]);

    await library.refreshAll([createPost({ fetchedAt: NOW - (28 * DAY) })]);

    expect(onRefreshed).not.toHaveBeenCalled();
  });

  test("refreshes a post fetched over 28 days ago", async() => {
    const { library, onRefreshed } = setup([createPost(DIMENSIONS)]);

    await library.refreshAll([createPost({ fetchedAt: NOW - (28 * DAY) - 1 })]);

    expect(onRefreshed).toHaveBeenCalledOnce();
  });

  test("replaces a stale post with its fetched copy", async() => {
    const { library, onRefreshed } = setup([createPost({ ...DIMENSIONS, score: 9 })]);

    await library.refreshAll([createPost()]);

    expect(onRefreshed).toHaveBeenCalledOnce();
    expect(onRefreshed.mock.calls[0][0]).toMatchObject({ post: { score: 9, width: 100, fetchedAt: NOW } });
  });

  test("writes a refreshed post once the write delay passes", async() => {
    const { library, localPosts, scheduler } = setup([createPost(DIMENSIONS)]);

    await library.refreshAll([createPost()]);
    scheduler.advance(WRITE_DELAY - 1);
    expect(await storedIdsOf(localPosts, ["0"])).toEqual([]);

    scheduler.advance(1);
    expect(await storedIdsOf(localPosts, ["0"])).toEqual(["0"]);
  });

  test("writes refreshed posts without waiting once a batch fills", async() => {
    const ids = Array.from({ length: WRITE_BATCH_SIZE }, (_, i) => String(i));
    const { library, localPosts } = setup(ids.map(id => createPost({ ...DIMENSIONS, id })));

    await library.refreshAll(ids.map(id => createPost({ id })));

    expect(await storedIdsOf(localPosts, ids)).toEqual(ids);
  });

  test("reports but never writes a refreshed post without dimensions", async() => {
    const { library, localPosts, scheduler, onRefreshed } = setup([createPost({ score: 9 })]);

    await library.refreshAll([createPost()]);
    scheduler.advance(WRITE_DELAY);

    expect(onRefreshed).toHaveBeenCalledOnce();
    expect(await storedIdsOf(localPosts, ["0"])).toEqual([]);
  });

  test("fills a video's duration on its fetched copy", async() => {
    const { library, onRefreshed } = setup([createPost({ ...DIMENSIONS, ...UNTIMED_VIDEO, score: 9 })]);

    await library.refreshAll([createPost({ ...UNTIMED_VIDEO })]);

    expect(onRefreshed).toHaveBeenCalledOnce();
    expect(onRefreshed.mock.calls[0][0]).toMatchObject({ post: { score: 9, durationSeconds: 12 } });
  });

  test("still fills a video's duration when its fetch fails", async() => {
    const { library, onRefreshed } = setup();

    await library.refreshAll([createPost({ ...UNTIMED_VIDEO })]);

    expect(onRefreshed.mock.calls[0][0]).toMatchObject({ post: { durationSeconds: 12 } });
  });

  test("does not fetch the duration of a video that has one", async() => {
    const { library, fetchDurationSeconds } = setup();

    await library.refreshAll([createPost({ ...UNTIMED_VIDEO, durationSeconds: 5, fetchedAt: NOW })]);

    expect(fetchDurationSeconds).not.toHaveBeenCalled();
  });

  test("leaves a video alone when its duration fetch fails", async() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { library, onRefreshed } = setup([], () => Promise.reject(new Error("offline")));

    await library.refreshAll([createPost({ ...UNTIMED_VIDEO, fetchedAt: NOW })]);

    expect(onRefreshed).not.toHaveBeenCalled();
  });
});
