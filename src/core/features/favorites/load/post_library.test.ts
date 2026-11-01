import { afterEach, describe, expect, test, vi } from "vitest";
import { MemoryClient } from "@/adapters/memory/client/memory_client";
import { MemoryLocalPosts } from "@/adapters/memory/ports/local_posts/memory_local_posts";
import { MemoryLocalTagCategories } from "@/adapters/memory/ports/local_tag_categories/memory_local_tag_categories";
import { MemoryRemotePosts } from "@/adapters/memory/ports/remote_posts/memory_remote_posts";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/memory_scheduler";
import { Post } from "@/core/domain/post/post";
import { PostLibrary } from "@/core/features/favorites/load/post_library";
import { RemoteMedia } from "@/core/boundary/ports/remote_media/remote_media";
import { createPost } from "@/testing/post";
import { flushMicrotasks } from "@/testing/microtask_utilities";

const WRITE_DELAY = 2_000;
const WRITE_BATCH_SIZE = 25;
const UNTIMED_VIDEO: Partial<Post> = { media: { kind: "video", locator: "" }, durationSeconds: 0 };
const DIMENSIONS: Partial<Post> = { width: 100, height: 100 };
const STORED_MEDIA: Partial<Post> = { media: { kind: "image", locator: "1/a.jpg" } };
const DAY = 24 * 60 * 60 * 1_000;
const NOW = 100 * DAY;

function setup(remotePosts: Post[] = [], probeDurationSeconds: RemoteMedia["probeDurationSeconds"] = () => Promise.resolve(12)): {
  postLibrary: PostLibrary;
  localPosts: MemoryLocalPosts;
  localTagCategories: MemoryLocalTagCategories;
  scheduler: MemoryScheduler;
  probeDurationSeconds: ReturnType<typeof vi.fn<RemoteMedia["probeDurationSeconds"]>>;
  onRefresh: ReturnType<typeof vi.fn>;
} {
  const localPosts = new MemoryLocalPosts();
  const localTagCategories = new MemoryLocalTagCategories();
  const scheduler = new MemoryScheduler(NOW);
  const probeDuration = vi.fn(probeDurationSeconds);
  const onRefresh = vi.fn();
  const postLibrary = new PostLibrary({
    localPosts,
    localTagCategories,
    remotePosts: new MemoryRemotePosts(new MemoryClient(remotePosts)),
    remoteMedia: { probeDurationSeconds: probeDuration },
    scheduler,
    onRefresh
  });
  return { postLibrary, localPosts, localTagCategories, scheduler, probeDurationSeconds: probeDuration, onRefresh };
}

async function readLocalPostIds(localPosts: MemoryLocalPosts, postIds: string[]): Promise<string[]> {
  return (await localPosts.getMany(postIds)).map(post => post.id);
}

describe("PostLibrary", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("streams local posts in batches of the given size", async() => {
    const { postLibrary, localPosts } = setup();
    const batches: string[][] = [];

    await localPosts.setMany(["1", "2", "3"].map(id => createPost({ id })));
    await postLibrary.stream(["1", "2", "3"], 2, posts => batches.push(posts.map(post => post.id)));

    expect(batches).toEqual([["1", "2"], ["3"]]);
  });

  test("streams a placeholder in place of a post that isn't stored", async() => {
    const { postLibrary, localPosts } = setup();
    const streamedPosts: Post[] = [];

    await localPosts.setMany(["1", "3"].map(id => createPost({ ...STORED_MEDIA, id, tags: "apple" })));
    await postLibrary.stream(["1", "2", "3"], 10, posts => streamedPosts.push(...posts));

    expect(streamedPosts.map(post => post.tags)).toEqual(["apple", "", "apple"]);
    expect(streamedPosts[1]).toMatchObject({ id: "2", media: { locator: "" } });
    expect(streamedPosts[1].fetchedAt).toBeUndefined();
  });

  test("hydrates a placeholder with its fetched post and stores it", async() => {
    const { postLibrary, localPosts, scheduler, onRefresh } = setup([createPost({ ...DIMENSIONS, id: "2", tags: "apple" })]);
    const streamedPosts: Post[] = [];

    await postLibrary.stream(["2"], 10, posts => streamedPosts.push(...posts));
    await postLibrary.refresh(streamedPosts);
    scheduler.advance(WRITE_DELAY);

    expect(onRefresh.mock.calls[0][0]).toMatchObject({ id: "2", tags: "apple" });
    expect(await readLocalPostIds(localPosts, ["2"])).toEqual(["2"]);
  });

  test("fetches placeholders before stale posts", async() => {
    const fetched: string[] = [];
    const { postLibrary, localPosts } = setup(["1", "2", "3"].map(id => createPost({ ...DIMENSIONS, id })));
    const streamedPosts: Post[] = [];

    vi.spyOn(MemoryRemotePosts.prototype, "fetch").mockImplementation(({ id }) => {
      fetched.push(id);
      return Promise.resolve({ post: createPost({ ...DIMENSIONS, id }), tagCategories: new Map() });
    });
    await localPosts.setMany([createPost({ ...STORED_MEDIA, id: "1" }), createPost({ ...STORED_MEDIA, id: "3" })]);
    await postLibrary.stream(["1", "2", "3"], 10, posts => streamedPosts.push(...posts));
    await postLibrary.refresh(streamedPosts);

    expect(fetched).toEqual(["2", "1", "3"]);
  });

  test("stores only posts not already stored when adopting", async() => {
    const { postLibrary, localPosts } = setup();

    await localPosts.setMany([createPost({ id: "1", score: 5 })]);
    await postLibrary.adopt([createPost({ id: "1", score: 0 }), createPost({ id: "2" })]);

    expect((await localPosts.getMany(["1", "2"])).map(post => post.score)).toEqual([5, 0]);
  });

  test("returns the stored copy of a post in place of the one given when adopting", async() => {
    const { postLibrary, localPosts } = setup();

    await localPosts.setMany([createPost({ id: "1", score: 5, fetchedAt: NOW })]);
    const adoptedPosts = await postLibrary.adopt([createPost({ id: "2" }), createPost({ id: "1", score: 0 })]);

    expect(adoptedPosts.map(post => [post.id, post.score, post.fetchedAt])).toEqual([["2", 0, undefined], ["1", 5, NOW]]);
  });

  test("returns the given post when adopting finds no stored copy", async() => {
    const { postLibrary, localPosts } = setup();
    const post = createPost({ id: "1" });

    vi.spyOn(localPosts, "setManyIfAbsent").mockResolvedValue();

    expect(await postLibrary.adopt([post])).toEqual([post]);
  });

  test("leaves a fresh post alone", async() => {
    const { postLibrary, onRefresh } = setup([createPost({ ...DIMENSIONS, score: 9 })]);

    await postLibrary.refresh([createPost({ fetchedAt: NOW })]);

    expect(onRefresh).not.toHaveBeenCalled();
  });

  test("leaves a post fetched within 28 days alone", async() => {
    const { postLibrary, onRefresh } = setup([createPost(DIMENSIONS)]);

    await postLibrary.refresh([createPost({ fetchedAt: NOW - (28 * DAY) })]);

    expect(onRefresh).not.toHaveBeenCalled();
  });

  test("refreshes a post fetched over 28 days ago", async() => {
    const { postLibrary, onRefresh } = setup([createPost(DIMENSIONS)]);

    await postLibrary.refresh([createPost({ fetchedAt: NOW - (28 * DAY) - 1 })]);

    expect(onRefresh).toHaveBeenCalledOnce();
  });

  test.each([
    { outcome: "leaves", id: "13", age: 34 * DAY, refreshCount: 0 },
    { outcome: "refreshes", id: "13", age: (34 * DAY) + 1, refreshCount: 1 }
  ])("$outcome a post past 28 days plus its id remainder of 7 in days", async({ id, age, refreshCount }) => {
    const { postLibrary, onRefresh } = setup([createPost({ ...DIMENSIONS, id })]);

    await postLibrary.refresh([createPost({ id, fetchedAt: NOW - age })]);

    expect(onRefresh).toHaveBeenCalledTimes(refreshCount);
  });

  test("replaces a stale post with its fetched copy", async() => {
    const { postLibrary, onRefresh } = setup([createPost({ ...DIMENSIONS, score: 9 })]);

    await postLibrary.refresh([createPost()]);

    expect(onRefresh).toHaveBeenCalledOnce();
    expect(onRefresh.mock.calls[0][0]).toMatchObject({ score: 9, width: 100, fetchedAt: NOW });
  });

  test("stores the tag categories fetched with a stale post", async() => {
    const { postLibrary, localTagCategories } = setup();

    vi.spyOn(MemoryRemotePosts.prototype, "fetch").mockResolvedValue({ post: createPost(DIMENSIONS), tagCategories: new Map([["alice", "artist"]]) });
    await postLibrary.refresh([createPost()]);
    await flushMicrotasks();

    expect(await localTagCategories.getMany(["alice"])).toEqual(new Map([["alice", "artist"]]));
  });

  test("writes a refreshed post once the write delay passes", async() => {
    const { postLibrary, localPosts, scheduler } = setup([createPost(DIMENSIONS)]);

    await postLibrary.refresh([createPost()]);
    scheduler.advance(WRITE_DELAY - 1);
    expect(await readLocalPostIds(localPosts, ["0"])).toEqual([]);

    scheduler.advance(1);
    expect(await readLocalPostIds(localPosts, ["0"])).toEqual(["0"]);
  });

  test("writes refreshed posts without waiting once a batch fills", async() => {
    const postIds = Array.from({ length: WRITE_BATCH_SIZE }, (_, i) => String(i));
    const { postLibrary, localPosts } = setup(postIds.map(id => createPost({ ...DIMENSIONS, id })));

    await postLibrary.refresh(postIds.map(id => createPost({ id })));

    expect(await readLocalPostIds(localPosts, postIds)).toEqual(postIds);
  });

  test("reports but never writes a refreshed post without dimensions", async() => {
    const { postLibrary, localPosts, scheduler, onRefresh } = setup([createPost({ score: 9 })]);

    await postLibrary.refresh([createPost()]);
    scheduler.advance(WRITE_DELAY);

    expect(onRefresh).toHaveBeenCalledOnce();
    expect(await readLocalPostIds(localPosts, ["0"])).toEqual([]);
  });

  test("fills a video's duration on its fetched copy", async() => {
    const { postLibrary, onRefresh } = setup([createPost({ ...DIMENSIONS, ...UNTIMED_VIDEO, score: 9 })]);

    await postLibrary.refresh([createPost({ ...UNTIMED_VIDEO })]);

    expect(onRefresh).toHaveBeenCalledOnce();
    expect(onRefresh.mock.calls[0][0]).toMatchObject({ score: 9, durationSeconds: 12 });
  });

  test("still fills a video's duration when its fetch fails", async() => {
    const { postLibrary, onRefresh } = setup();

    await postLibrary.refresh([createPost({ ...UNTIMED_VIDEO })]);

    expect(onRefresh.mock.calls[0][0]).toMatchObject({ durationSeconds: 12 });
  });

  test("does not fetch the duration of a video that has one", async() => {
    const { postLibrary, probeDurationSeconds } = setup();

    await postLibrary.refresh([createPost({ ...UNTIMED_VIDEO, durationSeconds: 5, fetchedAt: NOW })]);

    expect(probeDurationSeconds).not.toHaveBeenCalled();
  });

  test("keeps a stale video's known duration when its fetched copy has none", async() => {
    const { postLibrary, probeDurationSeconds, onRefresh } = setup([createPost({ ...DIMENSIONS, media: UNTIMED_VIDEO.media, score: 9 })]);

    await postLibrary.refresh([createPost({ ...UNTIMED_VIDEO, durationSeconds: 5 })]);

    expect(probeDurationSeconds).not.toHaveBeenCalled();
    expect(onRefresh.mock.calls[0][0]).toMatchObject({ score: 9, durationSeconds: 5 });
  });

  test("leaves a video alone when its duration fetch fails", async() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { postLibrary, onRefresh } = setup([], () => Promise.reject(new Error("offline")));

    await postLibrary.refresh([createPost({ ...UNTIMED_VIDEO, fetchedAt: NOW })]);

    expect(onRefresh).not.toHaveBeenCalled();
  });
});
