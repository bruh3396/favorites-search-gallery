import { describe, expect, test } from "vitest";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/memory_scheduler";
import { Post } from "@/core/domain/post/post";
import { Rule34NewFavoritesFinder } from "@/adapters/rule34/ports/remote_favorites/rule34_new_favorites_finder";
import { advanceAndSettle } from "@/testing/async";
import { createPost } from "@/testing/post";

const PAGE_SIZE = 5;
const MINIMUM_LOCAL_RUN_LENGTH = 5;
const FETCH_DELAY = 1_000;
const NO_DELAY = 0;

interface FakeRemote {
  fetch: (pageIndex: number) => Promise<Post[]>;
  requested: number[];
}

interface FinderRun {
  fakeRemote: FakeRemote;
  localPostIds: string[];
  firstPagePosts?: Post[];
  minimumLocalRunLength?: number;
}

function createLocalPostIds(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `local${i}`);
}

function createNewPostIds(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `new${i}`);
}

function createPagePosts(remotePostIds: string[], pageIndex: number): Post[] {
  return remotePostIds.slice(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE).map(id => createPost({ id }));
}

function createFakeRemote(remotePostIds: string[]): FakeRemote {
  const requested: number[] = [];
  return {
    requested,
    fetch: (pageIndex: number): Promise<Post[]> => {
      requested.push(pageIndex);
      return Promise.resolve(createPagePosts(remotePostIds, pageIndex));
    }
  };
}

function createFinder(fakeRemote: FakeRemote, minimumLocalRunLength: number): Rule34NewFavoritesFinder {
  return new Rule34NewFavoritesFinder(
    { pageSize: PAGE_SIZE, minimumLocalRunLength, fetchDelay: NO_DELAY },
    { fetch: fakeRemote.fetch, scheduler: { sleep: (): Promise<void> => Promise.resolve() } }
  );
}

async function runFinder({ fakeRemote, localPostIds, firstPagePosts, minimumLocalRunLength = MINIMUM_LOCAL_RUN_LENGTH }: FinderRun): Promise<string[]> {
  return (await createFinder(fakeRemote, minimumLocalRunLength).findNew(localPostIds, firstPagePosts)).map(post => post.id);
}

function findNewPostIds(localPostIds: string[], remotePostIds: string[]): Promise<string[]> {
  return runFinder({ fakeRemote: createFakeRemote(remotePostIds), localPostIds });
}

describe("Rule34NewFavoritesFinder", () => {
  test("finds nothing new when the remote lists exactly the local favorites", async() => {
    const localPostIds = createLocalPostIds(23);

    expect(await findNewPostIds(localPostIds, localPostIds)).toEqual([]);
  });

  test("finds new favorites above the local favorites", async() => {
    const localPostIds = createLocalPostIds(23);

    expect(await findNewPostIds(localPostIds, ["new0", "new1", ...localPostIds])).toEqual(["new0", "new1"]);
  });

  test("finds a re-favorited local favorite at the top", async() => {
    const localPostIds = createLocalPostIds(23);
    const remotePostIds = ["local3", ...localPostIds.filter(id => id !== "local3")];

    expect(await findNewPostIds(localPostIds, remotePostIds)).toEqual(["local3"]);
  });

  test("finds the newest local favorite as new when it was re-favorited after another", async() => {
    const localPostIds = createLocalPostIds(23);
    const remotePostIds = ["local0", "local3", ...localPostIds.filter(id => id !== "local0" && id !== "local3")];

    expect(await findNewPostIds(localPostIds, remotePostIds)).toEqual(["local0", "local3"]);
  });

  test("finds new favorites when the newest local favorite was removed", async() => {
    const localPostIds = createLocalPostIds(23);

    expect(await findNewPostIds(localPostIds, ["new0", ...localPostIds.slice(1)])).toEqual(["new0"]);
  });

  test("keeps reading pages while new favorites fill them", async() => {
    const localPostIds = createLocalPostIds(23);
    const newPostIds = createNewPostIds(12);

    expect(await findNewPostIds(localPostIds, [...newPostIds, ...localPostIds])).toEqual(newPostIds);
  });

  test("finds new and re-favorited favorites mixed together", async() => {
    const localPostIds = createLocalPostIds(23);
    const remotePostIds = ["new0", "local7", "new1", ...localPostIds.filter(id => id !== "local7")];

    expect(await findNewPostIds(localPostIds, remotePostIds)).toEqual(["new0", "local7", "new1"]);
  });

  test("skips over removed local favorites inside the local order", async() => {
    const localPostIds = createLocalPostIds(23);
    const remotePostIds = ["new0", ...localPostIds.filter(id => !["local1", "local2", "local5"].includes(id))];

    expect(await findNewPostIds(localPostIds, remotePostIds)).toEqual(["new0"]);
  });

  test("accepts a local order shorter than a page when the remote's list ends", async() => {
    const localPostIds = createLocalPostIds(23);

    expect(await findNewPostIds(localPostIds, ["new0", "local1", "local3"])).toEqual(["new0"]);
  });

  test("reads one more page to learn that a full last page ends the remote's list", async() => {
    const fakeRemote = createFakeRemote(["new0", "new1", "local0", "local1", "local2"]);

    expect(await runFinder({ fakeRemote, localPostIds: createLocalPostIds(3) })).toEqual(["new0", "new1"]);
    expect(fakeRemote.requested).toEqual([0, 1]);
  });

  test("finds nothing new when every favorite was removed", async() => {
    expect(await findNewPostIds(createLocalPostIds(23), [])).toEqual([]);
  });

  test("finds every favorite new when every local favorite was removed", async() => {
    expect(await findNewPostIds(createLocalPostIds(23), ["new0", "new1"])).toEqual(["new0", "new1"]);
  });

  test("leaves a removed and re-favorited favorite that still fits the local order", async() => {
    const localPostIds = createLocalPostIds(23);

    expect(await findNewPostIds(localPostIds, localPostIds.slice(1))).toEqual([]);
  });

  test("makes no request when the page on screen shows nothing new", async() => {
    const localPostIds = createLocalPostIds(23);
    const fakeRemote = createFakeRemote(localPostIds);

    expect(await runFinder({ fakeRemote, localPostIds, firstPagePosts: createPagePosts(localPostIds, 0) })).toEqual([]);
    expect(fakeRemote.requested).toEqual([]);
  });

  test("fetches the pages after the page on screen", async() => {
    const localPostIds = createLocalPostIds(23);
    const remotePostIds = [...createNewPostIds(7), ...localPostIds];
    const fakeRemote = createFakeRemote(remotePostIds);

    expect(await runFinder({ fakeRemote, localPostIds, firstPagePosts: createPagePosts(remotePostIds, 0) })).toEqual(createNewPostIds(7));
    expect(fakeRemote.requested).toEqual([1, 2]);
  });

  test("reads past a page of local favorites when the minimum local run length is longer than a page", async() => {
    const localPostIds = createLocalPostIds(23);
    const refavoritedPostIds = ["local10", "local11", "local12", "local13", "local14", "local15"];
    const remotePostIds = [...refavoritedPostIds, ...localPostIds.filter(id => !refavoritedPostIds.includes(id))];
    const fakeRemote = createFakeRemote(remotePostIds);

    expect(await runFinder({ fakeRemote, localPostIds, minimumLocalRunLength: 8 })).toEqual(refavoritedPostIds);
    expect(fakeRemote.requested).toEqual([0, 1, 2]);
  });

  test("stops inside the first page when the minimum local run length is shorter than a page", async() => {
    const localPostIds = createLocalPostIds(23);
    const fakeRemote = createFakeRemote(["new0", ...localPostIds]);

    expect(await runFinder({ fakeRemote, localPostIds, minimumLocalRunLength: 2 })).toEqual(["new0"]);
    expect(fakeRemote.requested).toEqual([0]);
  });

  test("passes on a failed request", async() => {
    const refused = new Error("refused");
    const fakeRemote: FakeRemote = { requested: [], fetch: () => Promise.reject(refused) };

    await expect(runFinder({ fakeRemote, localPostIds: createLocalPostIds(23) })).rejects.toBe(refused);
  });

  test("waits the fetch delay before every page after the first", async() => {
    const localPostIds = createLocalPostIds(23);
    const fakeRemote = createFakeRemote([...createNewPostIds(12), ...localPostIds]);
    const scheduler = new MemoryScheduler();
    const rule34NewFavoritesFinder = new Rule34NewFavoritesFinder(
      { pageSize: PAGE_SIZE, minimumLocalRunLength: MINIMUM_LOCAL_RUN_LENGTH, fetchDelay: FETCH_DELAY },
      { fetch: fakeRemote.fetch, scheduler }
    );
    const found = rule34NewFavoritesFinder.findNew(localPostIds);

    await advanceAndSettle(scheduler, 0);
    expect(fakeRemote.requested).toEqual([0]);

    await advanceAndSettle(scheduler, FETCH_DELAY - 1);
    expect(fakeRemote.requested).toEqual([0]);

    await advanceAndSettle(scheduler, 1);
    expect(fakeRemote.requested).toEqual([0, 1]);

    await advanceAndSettle(scheduler, FETCH_DELAY * 10);
    expect((await found).map(post => post.id)).toEqual(createNewPostIds(12));
  });
});
