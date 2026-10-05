import { afterEach, describe, expect, test, vi } from "vitest";
import { FavoritesPostLibrary } from "@/core/features/favorites/flows/load/post_library";
import { MemoryClient } from "@/adapters/memory/client/client";
import { MemoryLocalPosts } from "@/adapters/memory/ports/local_posts/local_posts";
import { MemoryLocalTagCategories } from "@/adapters/memory/ports/local_tag_categories/local_tag_categories";
import { MemoryRemotePosts } from "@/adapters/memory/ports/remote_posts/remote_posts";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { Post } from "@/core/domain/post/post";
import { RemoteMedia } from "@/core/boundary/ports/remote_media/remote_media";
import { createPost } from "@/testing/post";
import { flushMicrotasks } from "@/testing/async";

const WRITE_DELAY = 2_000;
const WRITE_BATCH_SIZE = 25;
const UNTIMED_VIDEO: Partial<Post> = { media: { kind: "video", locator: "" }, durationSeconds: 0 };
const DIMENSIONS: Partial<Post> = { width: 100, height: 100 };
const STORED_MEDIA: Partial<Post> = { media: { kind: "image", locator: "1/a.jpg" } };
const DAY = 24 * 60 * 60 * 1_000;
const NOW = 100 * DAY;

function setup(remotePosts: Post[] = [], fetchDurationSeconds: RemoteMedia["fetchDurationSeconds"] = () => Promise.resolve(12)): {
  library: FavoritesPostLibrary;
  localPosts: MemoryLocalPosts;
  localTagCategories: MemoryLocalTagCategories;
  scheduler: MemoryScheduler;
  fetchDurationSeconds: ReturnType<typeof vi.fn<RemoteMedia["fetchDurationSeconds"]>>;
  onRefreshed: ReturnType<typeof vi.fn>;
} {
  const localPosts = new MemoryLocalPosts();
  const localTagCategories = new MemoryLocalTagCategories();
  const scheduler = new MemoryScheduler(NOW);
  const fetchDuration = vi.fn(fetchDurationSeconds);
  const onRefreshed = vi.fn();
  const library = new FavoritesPostLibrary({
    localPosts,
    localTagCategories,
    remotePosts: new MemoryRemotePosts(new MemoryClient(remotePosts)),
    remoteMedia: { fetchDurationSeconds: fetchDuration },
    scheduler,
    onRefreshed
  });
  return { library, localPosts, localTagCategories, scheduler, fetchDurationSeconds: fetchDuration, onRefreshed };
}

async function readLocalIds(localPosts: MemoryLocalPosts, ids: string[]): Promise<string[]> {
  return (await localPosts.getMany(ids)).map(post => post.id);
}

describe("FavoritesPostLibrary", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("streams local posts in batches of the given size", async() => {
    const { library, localPosts } = setup();
    const batches: string[][] = [];

    await localPosts.setMany(["1", "2", "3"].map(id => createPost({ id })));
    await library.stream(["1", "2", "3"], 2, posts => batches.push(posts.map(post => post.id)));

    expect(batches).toEqual([["1", "2"], ["3"]]);
  });

  test("streams a placeholder in place of a post that isn't stored", async() => {
    const { library, localPosts } = setup();
    const streamed: Post[] = [];

    await localPosts.setMany(["1", "3"].map(id => createPost({ ...STORED_MEDIA, id, tags: "apple" })));
    await library.stream(["1", "2", "3"], 10, posts => streamed.push(...posts));

    expect(streamed.map(post => post.tags)).toEqual(["apple", "", "apple"]);
    expect(streamed[1]).toMatchObject({ id: "2", media: { locator: "" } });
    expect(streamed[1].fetchedAt).toBeUndefined();
  });

  test("hydrates a placeholder with its fetched post and stores it", async() => {
    const { library, localPosts, scheduler, onRefreshed } = setup([createPost({ ...DIMENSIONS, id: "2", tags: "apple" })]);
    const streamed: Post[] = [];

    await library.stream(["2"], 10, posts => streamed.push(...posts));
    await library.refresh(streamed);
    scheduler.advance(WRITE_DELAY);

    expect(onRefreshed.mock.calls[0][0]).toMatchObject({ id: "2", tags: "apple" });
    expect(await readLocalIds(localPosts, ["2"])).toEqual(["2"]);
  });

  test("fetches placeholders before stale posts", async() => {
    const fetched: string[] = [];
    const { library, localPosts } = setup(["1", "2", "3"].map(id => createPost({ ...DIMENSIONS, id })));
    const streamed: Post[] = [];

    vi.spyOn(MemoryRemotePosts.prototype, "fetch").mockImplementation(({ id }) => {
      fetched.push(id);
      return Promise.resolve({ post: createPost({ ...DIMENSIONS, id }), tagCategories: new Map() });
    });
    await localPosts.setMany([createPost({ ...STORED_MEDIA, id: "1" }), createPost({ ...STORED_MEDIA, id: "3" })]);
    await library.stream(["1", "2", "3"], 10, posts => streamed.push(...posts));
    await library.refresh(streamed);

    expect(fetched).toEqual(["2", "1", "3"]);
  });

  test("stores only posts not already stored when adopting", async() => {
    const { library, localPosts } = setup();

    await localPosts.setMany([createPost({ id: "1", score: 5 })]);
    await library.adopt([createPost({ id: "1", score: 0 }), createPost({ id: "2" })]);

    expect((await localPosts.getMany(["1", "2"])).map(post => post.score)).toEqual([5, 0]);
  });

  test("returns the stored copy of a post in place of the one given when adopting", async() => {
    const { library, localPosts } = setup();

    await localPosts.setMany([createPost({ id: "1", score: 5, fetchedAt: NOW })]);
    const adopted = await library.adopt([createPost({ id: "2" }), createPost({ id: "1", score: 0 })]);

    expect(adopted.map(post => [post.id, post.score, post.fetchedAt])).toEqual([["2", 0, undefined], ["1", 5, NOW]]);
  });

  test("leaves a fresh post alone", async() => {
    const { library, onRefreshed } = setup([createPost({ ...DIMENSIONS, score: 9 })]);

    await library.refresh([createPost({ fetchedAt: NOW })]);

    expect(onRefreshed).not.toHaveBeenCalled();
  });

  test("leaves a post fetched within 28 days alone", async() => {
    const { library, onRefreshed } = setup([createPost(DIMENSIONS)]);

    await library.refresh([createPost({ fetchedAt: NOW - (28 * DAY) })]);

    expect(onRefreshed).not.toHaveBeenCalled();
  });

  test("refreshes a post fetched over 28 days ago", async() => {
    const { library, onRefreshed } = setup([createPost(DIMENSIONS)]);

    await library.refresh([createPost({ fetchedAt: NOW - (28 * DAY) - 1 })]);

    expect(onRefreshed).toHaveBeenCalledOnce();
  });

  test("replaces a stale post with its fetched copy", async() => {
    const { library, onRefreshed } = setup([createPost({ ...DIMENSIONS, score: 9 })]);

    await library.refresh([createPost()]);

    expect(onRefreshed).toHaveBeenCalledOnce();
    expect(onRefreshed.mock.calls[0][0]).toMatchObject({ score: 9, width: 100, fetchedAt: NOW });
  });

  test("stores the tag categories fetched with a stale post", async() => {
    const { library, localTagCategories } = setup();

    vi.spyOn(MemoryRemotePosts.prototype, "fetch").mockResolvedValue({ post: createPost(DIMENSIONS), tagCategories: new Map([["alice", "artist"]]) });
    await library.refresh([createPost()]);
    await flushMicrotasks();

    expect(await localTagCategories.getMany(["alice"])).toEqual(new Map([["alice", "artist"]]));
  });

  test("writes a refreshed post once the write delay passes", async() => {
    const { library, localPosts, scheduler } = setup([createPost(DIMENSIONS)]);

    await library.refresh([createPost()]);
    scheduler.advance(WRITE_DELAY - 1);
    expect(await readLocalIds(localPosts, ["0"])).toEqual([]);

    scheduler.advance(1);
    expect(await readLocalIds(localPosts, ["0"])).toEqual(["0"]);
  });

  test("writes refreshed posts without waiting once a batch fills", async() => {
    const ids = Array.from({ length: WRITE_BATCH_SIZE }, (_, i) => String(i));
    const { library, localPosts } = setup(ids.map(id => createPost({ ...DIMENSIONS, id })));

    await library.refresh(ids.map(id => createPost({ id })));

    expect(await readLocalIds(localPosts, ids)).toEqual(ids);
  });

  test("reports but never writes a refreshed post without dimensions", async() => {
    const { library, localPosts, scheduler, onRefreshed } = setup([createPost({ score: 9 })]);

    await library.refresh([createPost()]);
    scheduler.advance(WRITE_DELAY);

    expect(onRefreshed).toHaveBeenCalledOnce();
    expect(await readLocalIds(localPosts, ["0"])).toEqual([]);
  });

  test("fills a video's duration on its fetched copy", async() => {
    const { library, onRefreshed } = setup([createPost({ ...DIMENSIONS, ...UNTIMED_VIDEO, score: 9 })]);

    await library.refresh([createPost({ ...UNTIMED_VIDEO })]);

    expect(onRefreshed).toHaveBeenCalledOnce();
    expect(onRefreshed.mock.calls[0][0]).toMatchObject({ score: 9, durationSeconds: 12 });
  });

  test("still fills a video's duration when its fetch fails", async() => {
    const { library, onRefreshed } = setup();

    await library.refresh([createPost({ ...UNTIMED_VIDEO })]);

    expect(onRefreshed.mock.calls[0][0]).toMatchObject({ durationSeconds: 12 });
  });

  test("does not fetch the duration of a video that has one", async() => {
    const { library, fetchDurationSeconds } = setup();

    await library.refresh([createPost({ ...UNTIMED_VIDEO, durationSeconds: 5, fetchedAt: NOW })]);

    expect(fetchDurationSeconds).not.toHaveBeenCalled();
  });

  test("keeps a stale video's known duration when its fetched copy has none", async() => {
    const { library, fetchDurationSeconds, onRefreshed } = setup([createPost({ ...DIMENSIONS, media: UNTIMED_VIDEO.media, score: 9 })]);

    await library.refresh([createPost({ ...UNTIMED_VIDEO, durationSeconds: 5 })]);

    expect(fetchDurationSeconds).not.toHaveBeenCalled();
    expect(onRefreshed.mock.calls[0][0]).toMatchObject({ score: 9, durationSeconds: 5 });
  });

  test("leaves a video alone when its duration fetch fails", async() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { library, onRefreshed } = setup([], () => Promise.reject(new Error("offline")));

    await library.refresh([createPost({ ...UNTIMED_VIDEO, fetchedAt: NOW })]);

    expect(onRefreshed).not.toHaveBeenCalled();
  });
});
