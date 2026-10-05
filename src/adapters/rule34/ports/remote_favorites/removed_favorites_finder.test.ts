import { describe, expect, test } from "vitest";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { Post } from "@/core/domain/post/post";
import { Rule34RemovedFavoritesFinder } from "@/adapters/rule34/ports/remote_favorites/removed_favorites_finder";
import { advanceAndSettle } from "@/testing/async";
import { createPost } from "@/testing/post";
import { seededFloat } from "@/core/utils/number/number";

const PAGE_SIZE = 5;
const FETCH_DELAY = 1_000;

interface FakeRemote {
  fetch: (pageIndex: number) => Promise<Post[]>;
  requested: number[];
}

function createLocalIds(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `local${i}`);
}

function createNewIds(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `new${i}`);
}

function removeIds(localIds: string[], removedIds: string[]): string[] {
  const removed = new Set(removedIds);
  return localIds.filter(id => !removed.has(id));
}

function createFakeRemote(remoteIds: string[]): FakeRemote {
  const requested: number[] = [];
  return {
    requested,
    fetch: (pageIndex: number): Promise<Post[]> => {
      requested.push(pageIndex);
      return Promise.resolve(remoteIds.slice(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE).map(id => createPost({ id })));
    }
  };
}

function createFinder(remote: FakeRemote): Rule34RemovedFavoritesFinder {
  return new Rule34RemovedFavoritesFinder(
    { pageSize: PAGE_SIZE, fetchDelay: 0 },
    { fetch: remote.fetch, scheduler: { sleep: (): Promise<void> => Promise.resolve() } }
  );
}

describe("Rule34RemovedFavoritesFinder", () => {
  test("finds nothing removed with one request for the remote page where the local list ends", async() => {
    const localIds = createLocalIds(23);
    const remote = createFakeRemote(localIds);

    expect(await createFinder(remote).findRemoved(localIds, 0)).toEqual([]);
    expect(remote.requested).toEqual([4]);
  });

  test("makes no requests when nothing is local", async() => {
    const remote = createFakeRemote([]);

    expect(await createFinder(remote).findRemoved([], 0)).toEqual([]);
    expect(remote.requested).toEqual([]);
  });

  test("finds a removal on the first remote page", async() => {
    const localIds = createLocalIds(23);
    const remote = createFakeRemote(removeIds(localIds, ["local1"]));

    expect(await createFinder(remote).findRemoved(localIds, 0)).toEqual(["local1"]);
  });

  test("finds a removal on the last remote page", async() => {
    const localIds = createLocalIds(23);
    const remote = createFakeRemote(removeIds(localIds, ["local21"]));

    expect(await createFinder(remote).findRemoved(localIds, 0)).toEqual(["local21"]);
  });

  test("finds removals that emptied the last remote page", async() => {
    const localIds = createLocalIds(23);
    const removedIds = ["local18", "local19", "local20", "local21", "local22"];
    const remote = createFakeRemote(removeIds(localIds, removedIds));

    expect(await createFinder(remote).findRemoved(localIds, 0)).toEqual(removedIds);
  });

  test("finds a removal in the middle with a binary search", async() => {
    const localIds = createLocalIds(100);
    const remote = createFakeRemote(removeIds(localIds, ["local52"]));

    expect(await createFinder(remote).findRemoved(localIds, 0)).toEqual(["local52"]);
    expect(remote.requested.length).toBeLessThanOrEqual(7);
  });

  test("finds every local favorite removed", async() => {
    const localIds = createLocalIds(23);
    const remote = createFakeRemote([]);

    expect(await createFinder(remote).findRemoved(localIds, 0)).toEqual(localIds);
  });

  test("finds nothing removed below new favorites with one request for the remote page where the local list ends", async() => {
    const localIds = createLocalIds(23);
    const remote = createFakeRemote([...createNewIds(7), ...localIds]);

    expect(await createFinder(remote).findRemoved(localIds, 7)).toEqual([]);
    expect(remote.requested).toEqual([5]);
  });

  test("finds a removal at the top of the local list below new favorites", async() => {
    const localIds = createLocalIds(23);
    const remote = createFakeRemote([...createNewIds(7), ...removeIds(localIds, ["local0"])]);

    expect(await createFinder(remote).findRemoved(localIds, 7)).toEqual(["local0"]);
  });

  test("finds a removal in the middle when the new favorites span several remote pages", async() => {
    const localIds = createLocalIds(100);
    const remote = createFakeRemote([...createNewIds(12), ...removeIds(localIds, ["local52"])]);

    expect(await createFinder(remote).findRemoved(localIds, 12)).toEqual(["local52"]);
    expect(remote.requested.length).toBeLessThanOrEqual(7);
  });

  test("finds every local favorite removed below new favorites", async() => {
    const localIds = createLocalIds(23);
    const remote = createFakeRemote(createNewIds(7));

    expect(await createFinder(remote).findRemoved(localIds, 7)).toEqual(localIds);
  });

  test.each(Array.from({ length: 200 }, (_, seed) => seed))("finds exactly the removed favorites in random lists (seed %i)", async seed => {
    const localIds = createLocalIds(1 + Math.floor(seededFloat(seed) * 60));
    const newIds = createNewIds(Math.floor(seededFloat(seed + 0.5) * 12));
    const removedIds = localIds.filter((_, i) => seededFloat((seed * 1_000) + i) < seededFloat(seed + 0.25));
    const remote = createFakeRemote([...newIds, ...removeIds(localIds, removedIds)]);

    expect(await createFinder(remote).findRemoved(localIds, newIds.length)).toEqual(removedIds);
  });

  test("passes on a failed request", async() => {
    const refused = new Error("refused");
    const remote: FakeRemote = { requested: [], fetch: () => Promise.reject(refused) };

    await expect(createFinder(remote).findRemoved(createLocalIds(23), 0)).rejects.toBe(refused);
  });

  test("waits the fetch delay before every request after the first", async() => {
    const localIds = createLocalIds(100);
    const remote = createFakeRemote(removeIds(localIds, ["local52"]));
    const scheduler = new MemoryScheduler();
    const finder = new Rule34RemovedFavoritesFinder({ pageSize: PAGE_SIZE, fetchDelay: FETCH_DELAY }, { fetch: remote.fetch, scheduler });
    const found = finder.findRemoved(localIds, 0);

    await advanceAndSettle(scheduler, 0);
    expect(remote.requested).toEqual([19]);

    await advanceAndSettle(scheduler, FETCH_DELAY - 1);
    expect(remote.requested).toEqual([19]);

    await advanceAndSettle(scheduler, 1);
    expect(remote.requested).toEqual([19, 9]);

    await advanceAndSettle(scheduler, FETCH_DELAY * 10);
    expect(await found).toEqual(["local52"]);
  });
});
