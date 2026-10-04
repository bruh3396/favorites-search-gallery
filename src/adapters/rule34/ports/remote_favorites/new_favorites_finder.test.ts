import { describe, expect, test } from "vitest";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { Post } from "@/core/domain/post/post";
import { Rule34NewFavoritesFinder } from "@/adapters/rule34/ports/remote_favorites/new_favorites_finder";
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
  remote: FakeRemote;
  localIds: string[];
  firstPage?: Post[];
  minimumLocalRunLength?: number;
}

function createLocalIds(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `local${i}`);
}

function createNewIds(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `new${i}`);
}

function createPagePosts(remoteIds: string[], pageIndex: number): Post[] {
  return remoteIds.slice(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE).map(id => createPost({ id }));
}

function createFakeRemote(remoteIds: string[]): FakeRemote {
  const requested: number[] = [];
  return {
    requested,
    fetch: (pageIndex: number): Promise<Post[]> => {
      requested.push(pageIndex);
      return Promise.resolve(createPagePosts(remoteIds, pageIndex));
    }
  };
}

function createFinder(remote: FakeRemote, minimumLocalRunLength: number): Rule34NewFavoritesFinder {
  return new Rule34NewFavoritesFinder(
    { pageSize: PAGE_SIZE, minimumLocalRunLength, fetchDelay: NO_DELAY },
    { fetch: remote.fetch, scheduler: { sleep: (): Promise<void> => Promise.resolve() } }
  );
}

async function runFinder({ remote, localIds, firstPage, minimumLocalRunLength = MINIMUM_LOCAL_RUN_LENGTH }: FinderRun): Promise<string[]> {
  return (await createFinder(remote, minimumLocalRunLength).findNew(localIds, firstPage)).map(post => post.id);
}

function findNewIds(localIds: string[], remoteIds: string[]): Promise<string[]> {
  return runFinder({ remote: createFakeRemote(remoteIds), localIds });
}

describe("Rule34NewFavoritesFinder", () => {
  test("finds nothing new when the remote lists exactly the local favorites", async() => {
    const localIds = createLocalIds(23);

    expect(await findNewIds(localIds, localIds)).toEqual([]);
  });

  test("finds new favorites above the local favorites", async() => {
    const localIds = createLocalIds(23);

    expect(await findNewIds(localIds, ["new0", "new1", ...localIds])).toEqual(["new0", "new1"]);
  });

  test("finds a re-favorited local favorite at the top", async() => {
    const localIds = createLocalIds(23);
    const remoteIds = ["local3", ...localIds.filter(id => id !== "local3")];

    expect(await findNewIds(localIds, remoteIds)).toEqual(["local3"]);
  });

  test("finds the newest local favorite as new when it was re-favorited after another", async() => {
    const localIds = createLocalIds(23);
    const remoteIds = ["local0", "local3", ...localIds.filter(id => id !== "local0" && id !== "local3")];

    expect(await findNewIds(localIds, remoteIds)).toEqual(["local0", "local3"]);
  });

  test("finds new favorites when the newest local favorite was removed", async() => {
    const localIds = createLocalIds(23);

    expect(await findNewIds(localIds, ["new0", ...localIds.slice(1)])).toEqual(["new0"]);
  });

  test("keeps reading pages while new favorites fill them", async() => {
    const localIds = createLocalIds(23);
    const newIds = createNewIds(12);

    expect(await findNewIds(localIds, [...newIds, ...localIds])).toEqual(newIds);
  });

  test("finds new and re-favorited favorites mixed together", async() => {
    const localIds = createLocalIds(23);
    const remoteIds = ["new0", "local7", "new1", ...localIds.filter(id => id !== "local7")];

    expect(await findNewIds(localIds, remoteIds)).toEqual(["new0", "local7", "new1"]);
  });

  test("skips over removed local favorites inside the local order", async() => {
    const localIds = createLocalIds(23);
    const remoteIds = ["new0", ...localIds.filter(id => !["local1", "local2", "local5"].includes(id))];

    expect(await findNewIds(localIds, remoteIds)).toEqual(["new0"]);
  });

  test("accepts a local order shorter than a page when the remote's list ends", async() => {
    const localIds = createLocalIds(23);

    expect(await findNewIds(localIds, ["new0", "local1", "local3"])).toEqual(["new0"]);
  });

  test("reads one more page to learn that a full last page ends the remote's list", async() => {
    const remote = createFakeRemote(["new0", "new1", "local0", "local1", "local2"]);

    expect(await runFinder({ remote, localIds: createLocalIds(3) })).toEqual(["new0", "new1"]);
    expect(remote.requested).toEqual([0, 1]);
  });

  test("finds nothing new when every favorite was removed", async() => {
    expect(await findNewIds(createLocalIds(23), [])).toEqual([]);
  });

  test("finds every favorite new when every local favorite was removed", async() => {
    expect(await findNewIds(createLocalIds(23), ["new0", "new1"])).toEqual(["new0", "new1"]);
  });

  test("leaves a removed and re-favorited favorite that still fits the local order", async() => {
    const localIds = createLocalIds(23);

    expect(await findNewIds(localIds, localIds.slice(1))).toEqual([]);
  });

  test("makes no request when the page on screen shows nothing new", async() => {
    const localIds = createLocalIds(23);
    const remote = createFakeRemote(localIds);

    expect(await runFinder({ remote, localIds, firstPage: createPagePosts(localIds, 0) })).toEqual([]);
    expect(remote.requested).toEqual([]);
  });

  test("fetches the pages after the page on screen", async() => {
    const localIds = createLocalIds(23);
    const remoteIds = [...createNewIds(7), ...localIds];
    const remote = createFakeRemote(remoteIds);

    expect(await runFinder({ remote, localIds, firstPage: createPagePosts(remoteIds, 0) })).toEqual(createNewIds(7));
    expect(remote.requested).toEqual([1, 2]);
  });

  test("reads past a page of local favorites when the minimum local run length is longer than a page", async() => {
    const localIds = createLocalIds(23);
    const refavoritedIds = ["local10", "local11", "local12", "local13", "local14", "local15"];
    const remoteIds = [...refavoritedIds, ...localIds.filter(id => !refavoritedIds.includes(id))];
    const remote = createFakeRemote(remoteIds);

    expect(await runFinder({ remote, localIds, minimumLocalRunLength: 8 })).toEqual(refavoritedIds);
    expect(remote.requested).toEqual([0, 1, 2]);
  });

  test("stops inside the first page when the minimum local run length is shorter than a page", async() => {
    const localIds = createLocalIds(23);
    const remote = createFakeRemote(["new0", ...localIds]);

    expect(await runFinder({ remote, localIds, minimumLocalRunLength: 2 })).toEqual(["new0"]);
    expect(remote.requested).toEqual([0]);
  });

  test("passes on a failed request", async() => {
    const refused = new Error("refused");
    const remote: FakeRemote = { requested: [], fetch: () => Promise.reject(refused) };

    await expect(runFinder({ remote, localIds: createLocalIds(23) })).rejects.toBe(refused);
  });

  test("waits the fetch delay before every page after the first", async() => {
    const localIds = createLocalIds(23);
    const remote = createFakeRemote([...createNewIds(12), ...localIds]);
    const scheduler = new MemoryScheduler();
    const finder = new Rule34NewFavoritesFinder(
      { pageSize: PAGE_SIZE, minimumLocalRunLength: MINIMUM_LOCAL_RUN_LENGTH, fetchDelay: FETCH_DELAY },
      { fetch: remote.fetch, scheduler }
    );
    const found = finder.findNew(localIds);

    await advanceAndSettle(scheduler, 0);
    expect(remote.requested).toEqual([0]);

    await advanceAndSettle(scheduler, FETCH_DELAY - 1);
    expect(remote.requested).toEqual([0]);

    await advanceAndSettle(scheduler, 1);
    expect(remote.requested).toEqual([0, 1]);

    await advanceAndSettle(scheduler, FETCH_DELAY * 10);
    expect((await found).map(post => post.id)).toEqual(createNewIds(12));
  });
});
