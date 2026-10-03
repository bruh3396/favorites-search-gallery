import { describe, expect, test } from "vitest";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { Post } from "@/core/domain/post/post";
import { Rule34NewFavoritesFinder } from "@/adapters/rule34/ports/remote_favorites/new_favorites_finder";
import { advanceAndSettle } from "@/testing/async";
import { createPost } from "@/testing/post";

const PAGE_SIZE = 5;
const REQUIRED_CONTINUITY = 5;
const FETCH_DELAY = 1_000;
const NO_DELAY = 0;

interface FakeSite {
  fetch: (pageIndex: number) => Promise<Post[]>;
  requested: number[];
}

interface FinderRun {
  site: FakeSite;
  storedIds: string[];
  firstPage?: Post[];
  requiredContinuity?: number;
}

function createStoredIds(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `id${i}`);
}

function createNewIds(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `new${i}`);
}

function createPagePosts(siteIds: string[], pageIndex: number): Post[] {
  return siteIds.slice(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE).map(id => createPost({ id }));
}

function createFakeSite(siteIds: string[]): FakeSite {
  const requested: number[] = [];
  return {
    requested,
    fetch: (pageIndex: number): Promise<Post[]> => {
      requested.push(pageIndex);
      return Promise.resolve(createPagePosts(siteIds, pageIndex));
    }
  };
}

function createFinder(site: FakeSite, requiredContinuity: number): Rule34NewFavoritesFinder {
  return new Rule34NewFavoritesFinder(
    { pageSize: PAGE_SIZE, requiredContinuity, fetchDelay: NO_DELAY },
    { fetch: site.fetch, scheduler: { sleep: (): Promise<void> => Promise.resolve() } }
  );
}

async function runFinder({ site, storedIds, firstPage, requiredContinuity = REQUIRED_CONTINUITY }: FinderRun): Promise<string[]> {
  return (await createFinder(site, requiredContinuity).findNew(storedIds, firstPage)).map(post => post.id);
}

function findNewIds(storedIds: string[], siteIds: string[]): Promise<string[]> {
  return runFinder({ site: createFakeSite(siteIds), storedIds });
}

describe("Rule34NewFavoritesFinder", () => {
  test("finds nothing new when the site lists exactly the stored favorites", async() => {
    const storedIds = createStoredIds(23);

    expect(await findNewIds(storedIds, storedIds)).toEqual([]);
  });

  test("finds new favorites above the stored favorites", async() => {
    const storedIds = createStoredIds(23);

    expect(await findNewIds(storedIds, ["new0", "new1", ...storedIds])).toEqual(["new0", "new1"]);
  });

  test("finds a re-favorited stored favorite at the top", async() => {
    const storedIds = createStoredIds(23);
    const siteIds = ["id3", ...storedIds.filter(id => id !== "id3")];

    expect(await findNewIds(storedIds, siteIds)).toEqual(["id3"]);
  });

  test("finds the newest stored favorite as new when it was re-favorited after another", async() => {
    const storedIds = createStoredIds(23);
    const siteIds = ["id0", "id3", ...storedIds.filter(id => id !== "id0" && id !== "id3")];

    expect(await findNewIds(storedIds, siteIds)).toEqual(["id0", "id3"]);
  });

  test("finds new favorites when the newest stored favorite was removed", async() => {
    const storedIds = createStoredIds(23);

    expect(await findNewIds(storedIds, ["new0", ...storedIds.slice(1)])).toEqual(["new0"]);
  });

  test("keeps reading pages while new favorites fill them", async() => {
    const storedIds = createStoredIds(23);
    const newIds = createNewIds(12);

    expect(await findNewIds(storedIds, [...newIds, ...storedIds])).toEqual(newIds);
  });

  test("finds new and re-favorited favorites mixed together", async() => {
    const storedIds = createStoredIds(23);
    const siteIds = ["new0", "id7", "new1", ...storedIds.filter(id => id !== "id7")];

    expect(await findNewIds(storedIds, siteIds)).toEqual(["new0", "id7", "new1"]);
  });

  test("skips over removed stored favorites inside the stored order", async() => {
    const storedIds = createStoredIds(23);
    const siteIds = ["new0", ...storedIds.filter(id => !["id1", "id2", "id5"].includes(id))];

    expect(await findNewIds(storedIds, siteIds)).toEqual(["new0"]);
  });

  test("accepts a stored order shorter than a page when the site's list ends", async() => {
    const storedIds = createStoredIds(23);

    expect(await findNewIds(storedIds, ["new0", "id1", "id3"])).toEqual(["new0"]);
  });

  test("reads one more page to learn that a full last page ends the site's list", async() => {
    const site = createFakeSite(["new0", "new1", "id0", "id1", "id2"]);

    expect(await runFinder({ site, storedIds: createStoredIds(3) })).toEqual(["new0", "new1"]);
    expect(site.requested).toEqual([0, 1]);
  });

  test("finds nothing new when every favorite was removed", async() => {
    expect(await findNewIds(createStoredIds(23), [])).toEqual([]);
  });

  test("finds every favorite new when every stored favorite was removed", async() => {
    expect(await findNewIds(createStoredIds(23), ["new0", "new1"])).toEqual(["new0", "new1"]);
  });

  test("leaves a removed and re-favorited favorite that still fits the stored order", async() => {
    const storedIds = createStoredIds(23);

    expect(await findNewIds(storedIds, storedIds.slice(1))).toEqual([]);
  });

  test("makes no request when the page on screen shows nothing new", async() => {
    const storedIds = createStoredIds(23);
    const site = createFakeSite(storedIds);

    expect(await runFinder({ site, storedIds, firstPage: createPagePosts(storedIds, 0) })).toEqual([]);
    expect(site.requested).toEqual([]);
  });

  test("fetches the pages after the page on screen", async() => {
    const storedIds = createStoredIds(23);
    const siteIds = [...createNewIds(7), ...storedIds];
    const site = createFakeSite(siteIds);

    expect(await runFinder({ site, storedIds, firstPage: createPagePosts(siteIds, 0) })).toEqual(createNewIds(7));
    expect(site.requested).toEqual([1, 2]);
  });

  test("reads past a page of stored favorites when the required continuity is longer than a page", async() => {
    const storedIds = createStoredIds(23);
    const refavoritedIds = ["id10", "id11", "id12", "id13", "id14", "id15"];
    const siteIds = [...refavoritedIds, ...storedIds.filter(id => !refavoritedIds.includes(id))];
    const site = createFakeSite(siteIds);

    expect(await runFinder({ site, storedIds, requiredContinuity: 8 })).toEqual(refavoritedIds);
    expect(site.requested).toEqual([0, 1, 2]);
  });

  test("stops inside the first page when the required continuity is shorter than a page", async() => {
    const storedIds = createStoredIds(23);
    const site = createFakeSite(["new0", ...storedIds]);

    expect(await runFinder({ site, storedIds, requiredContinuity: 2 })).toEqual(["new0"]);
    expect(site.requested).toEqual([0]);
  });

  test("passes on a failed request", async() => {
    const refused = new Error("refused");
    const site: FakeSite = { requested: [], fetch: () => Promise.reject(refused) };

    await expect(runFinder({ site, storedIds: createStoredIds(23) })).rejects.toBe(refused);
  });

  test("waits the fetch delay before every page after the first", async() => {
    const storedIds = createStoredIds(23);
    const site = createFakeSite([...createNewIds(12), ...storedIds]);
    const scheduler = new MemoryScheduler();
    const finder = new Rule34NewFavoritesFinder(
      { pageSize: PAGE_SIZE, requiredContinuity: REQUIRED_CONTINUITY, fetchDelay: FETCH_DELAY },
      { fetch: site.fetch, scheduler }
    );
    const found = finder.findNew(storedIds);

    await advanceAndSettle(scheduler, 0);
    expect(site.requested).toEqual([0]);

    await advanceAndSettle(scheduler, FETCH_DELAY - 1);
    expect(site.requested).toEqual([0]);

    await advanceAndSettle(scheduler, 1);
    expect(site.requested).toEqual([0, 1]);

    await advanceAndSettle(scheduler, FETCH_DELAY * 10);
    expect((await found).map(post => post.id)).toEqual(createNewIds(12));
  });
});
