import { describe, expect, test } from "vitest";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/memory_scheduler";
import { Post } from "@/core/domain/post/post";
import { Rule34MissingFavoritesFinder } from "@/adapters/rule34/ports/remote_favorites/rule34_missing_favorites_finder";
import { advanceAndSettle } from "@/testing/async";
import { createPost } from "@/testing/post";
import { seededFloat } from "@/core/utils/random/random_utilities";

const PAGE_SIZE = 5;
const FETCH_DELAY = 1_000;

interface FakeRemote {
  fetch: (pageIndex: number) => Promise<Post[]>;
  requested: number[];
}

function createLocalPostIds(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `local${i}`);
}

function createNewPostIds(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `new${i}`);
}

function removePostIds(localPostIds: string[], removedPostIds: string[]): string[] {
  const removed = new Set(removedPostIds);
  return localPostIds.filter(id => !removed.has(id));
}

function createFakeRemote(remotePostIds: string[]): FakeRemote {
  const requested: number[] = [];
  return {
    requested,
    fetch: (pageIndex: number): Promise<Post[]> => {
      requested.push(pageIndex);
      return Promise.resolve(remotePostIds.slice(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE).map(id => createPost({ id })));
    }
  };
}

function createFinder(remote: FakeRemote): Rule34MissingFavoritesFinder {
  return new Rule34MissingFavoritesFinder(
    { pageSize: PAGE_SIZE, fetchDelay: 0 },
    { fetch: remote.fetch, scheduler: { sleep: (): Promise<void> => Promise.resolve() } }
  );
}

describe("Rule34MissingFavoritesFinder", () => {
  test("finds nothing removed with one request for the remote page where the local list ends", async() => {
    const localPostIds = createLocalPostIds(23);
    const remote = createFakeRemote(localPostIds);

    expect(await createFinder(remote).findMissing(localPostIds, 0)).toEqual([]);
    expect(remote.requested).toEqual([4]);
  });

  test("makes no requests when nothing is local", async() => {
    const remote = createFakeRemote([]);

    expect(await createFinder(remote).findMissing([], 0)).toEqual([]);
    expect(remote.requested).toEqual([]);
  });

  test("finds a removal on the first remote page", async() => {
    const localPostIds = createLocalPostIds(23);
    const remote = createFakeRemote(removePostIds(localPostIds, ["local1"]));

    expect(await createFinder(remote).findMissing(localPostIds, 0)).toEqual(["local1"]);
  });

  test("finds a removal on the last remote page", async() => {
    const localPostIds = createLocalPostIds(23);
    const remote = createFakeRemote(removePostIds(localPostIds, ["local21"]));

    expect(await createFinder(remote).findMissing(localPostIds, 0)).toEqual(["local21"]);
  });

  test("finds removals that emptied the last remote page", async() => {
    const localPostIds = createLocalPostIds(23);
    const removedPostIds = ["local18", "local19", "local20", "local21", "local22"];
    const remote = createFakeRemote(removePostIds(localPostIds, removedPostIds));

    expect(await createFinder(remote).findMissing(localPostIds, 0)).toEqual(removedPostIds);
  });

  test("finds a removal in the middle with a binary search", async() => {
    const localPostIds = createLocalPostIds(100);
    const remote = createFakeRemote(removePostIds(localPostIds, ["local52"]));

    expect(await createFinder(remote).findMissing(localPostIds, 0)).toEqual(["local52"]);
    expect(remote.requested.length).toBeLessThanOrEqual(7);
  });

  test("finds every local favorite removed", async() => {
    const localPostIds = createLocalPostIds(23);
    const remote = createFakeRemote([]);

    expect(await createFinder(remote).findMissing(localPostIds, 0)).toEqual(localPostIds);
  });

  test("finds nothing removed below new favorites with one request for the remote page where the local list ends", async() => {
    const localPostIds = createLocalPostIds(23);
    const remote = createFakeRemote([...createNewPostIds(7), ...localPostIds]);

    expect(await createFinder(remote).findMissing(localPostIds, 7)).toEqual([]);
    expect(remote.requested).toEqual([5]);
  });

  test("finds a removal at the top of the local list below new favorites", async() => {
    const localPostIds = createLocalPostIds(23);
    const remote = createFakeRemote([...createNewPostIds(7), ...removePostIds(localPostIds, ["local0"])]);

    expect(await createFinder(remote).findMissing(localPostIds, 7)).toEqual(["local0"]);
  });

  test("finds a removal in the middle when the new favorites span several remote pages", async() => {
    const localPostIds = createLocalPostIds(100);
    const remote = createFakeRemote([...createNewPostIds(12), ...removePostIds(localPostIds, ["local52"])]);

    expect(await createFinder(remote).findMissing(localPostIds, 12)).toEqual(["local52"]);
    expect(remote.requested.length).toBeLessThanOrEqual(7);
  });

  test("finds every local favorite removed below new favorites", async() => {
    const localPostIds = createLocalPostIds(23);
    const remote = createFakeRemote(createNewPostIds(7));

    expect(await createFinder(remote).findMissing(localPostIds, 7)).toEqual(localPostIds);
  });

  test.each(Array.from({ length: 200 }, (_, seed) => seed))("finds exactly the removed favorites in random lists (seed %i)", async seed => {
    const localPostIds = createLocalPostIds(1 + Math.floor(seededFloat(seed) * 60));
    const newPostIds = createNewPostIds(Math.floor(seededFloat(seed + 0.5) * 12));
    const removedPostIds = localPostIds.filter((_, i) => seededFloat((seed * 1_000) + i) < seededFloat(seed + 0.25));
    const remote = createFakeRemote([...newPostIds, ...removePostIds(localPostIds, removedPostIds)]);

    expect(await createFinder(remote).findMissing(localPostIds, newPostIds.length)).toEqual(removedPostIds);
  });

  test("passes on a failed request", async() => {
    const refused = new Error("refused");
    const remote: FakeRemote = { requested: [], fetch: () => Promise.reject(refused) };

    await expect(createFinder(remote).findMissing(createLocalPostIds(23), 0)).rejects.toBe(refused);
  });

  test("waits the fetch delay before every request after the first", async() => {
    const localPostIds = createLocalPostIds(100);
    const remote = createFakeRemote(removePostIds(localPostIds, ["local52"]));
    const scheduler = new MemoryScheduler();
    const finder = new Rule34MissingFavoritesFinder({ pageSize: PAGE_SIZE, fetchDelay: FETCH_DELAY }, { fetch: remote.fetch, scheduler });
    const found = finder.findMissing(localPostIds, 0);

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
