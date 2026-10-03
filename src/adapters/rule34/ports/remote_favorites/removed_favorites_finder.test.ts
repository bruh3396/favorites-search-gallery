import { describe, expect, test } from "vitest";
import { Post } from "@/core/domain/post/post";
import { Rule34RemovedFavoritesFinder } from "@/adapters/rule34/ports/remote_favorites/removed_favorites_finder";
import { createPost } from "@/testing/post";

const PAGE_SIZE = 5;

interface FakeRemote {
  fetch: (pageIndex: number) => Promise<Post[]>;
  requested: number[];
}

function createLocalIds(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `local${i}`);
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
});
