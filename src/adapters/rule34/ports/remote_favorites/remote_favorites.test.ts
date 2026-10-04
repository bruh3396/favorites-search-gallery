import { Rule34RemoteFavorites, Rule34RemoteFavoritesDependencies, computeRetryDelay } from "@/adapters/rule34/ports/remote_favorites/remote_favorites";
import { describe, expect, test, vi } from "vitest";
import { FAVORITES_PER_PAGE } from "@/adapters/rule34/client/favorites_page";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/random_source";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { Post } from "@/core/domain/post/post";
import { Rule34Error } from "@/adapters/rule34/client/error";
import { advanceAndSettle } from "@/testing/async";
import { createPost } from "@/testing/post";

const PAGE_ID = "123";
const FETCH_DELAY = 1_000;
const MAX_FETCH_ATTEMPTS = 5;
const SETTLE_TIME = 60_000;

type Rule34 = Rule34RemoteFavoritesDependencies["rule34"];
type FetchPage = (pageId: string, pageIndex: number) => Promise<Post[]>;
type FetchCount = (pageId: string) => Promise<number>;

interface ClientOptions {
  fetchPage?: FetchPage;
  fetchCount?: FetchCount;
  firstPage?: Post[] | null;
}

interface Setup {
  remoteFavorites: Rule34RemoteFavorites;
  rule34: Rule34 & { prioritized: number };
  scheduler: MemoryScheduler;
}

function createPage(index: number, size = 1): Post[] {
  return Array.from({ length: size }, (_, i) => createPost({ id: `page${index}-${i}` }));
}

function getPostIds(posts: Post[]): string[] {
  return posts.map(post => post.id);
}

function createPageFetch(lastIndex: number, size = 1): FetchPage {
  return vi.fn((_pageId: string, pageIndex: number) => (
    Promise.resolve(pageIndex > lastIndex ? [] : createPage(pageIndex, size))
  ));
}

function createClient({
  fetchPage = createPageFetch(0),
  fetchCount = (): Promise<number> => Promise.resolve(0),
  firstPage = null
}: ClientOptions): Rule34 & { prioritized: number } {
  const rule34 = {
    prioritized: 0,
    readFavoritesPageId: (): string => PAGE_ID,
    readFirstFavoritesPage: (): Post[] | null => firstPage,
    fetchFavoritesPage: fetchPage,
    fetchFavoriteCount: fetchCount,
    prioritizeFavorites: <T>(fetchFavorites: () => Promise<T>): Promise<T> => {
      rule34.prioritized += 1;
      return fetchFavorites();
    }
  };
  return rule34;
}

function setup(options: ClientOptions = {}): Setup {
  const rule34 = createClient(options);
  const scheduler = new MemoryScheduler();
  const remoteFavorites = new Rule34RemoteFavorites({ rule34, scheduler, randomSource: new MemoryRandomSource([1]) });
  return { remoteFavorites, rule34, scheduler };
}

async function fetchAllFavorites(options: ClientOptions): Promise<Post[]> {
  const { remoteFavorites, scheduler } = setup(options);
  const delivered: Post[] = [];
  const run = remoteFavorites.fetchAll(posts => delivered.push(...posts));

  run.catch(() => { });
  await advanceAndSettle(scheduler, SETTLE_TIME);
  await run;
  return delivered;
}

async function findNewFavoriteIds(options: ClientOptions, localIds: string[]): Promise<string[]> {
  const { remoteFavorites, scheduler } = setup(options);
  const found = remoteFavorites.findNew(localIds);

  found.catch(() => { });
  await advanceAndSettle(scheduler, SETTLE_TIME);
  return getPostIds(await found);
}

async function findRemovedFavoriteIds(options: ClientOptions, localIds: string[], remoteStart = 0): Promise<string[]> {
  const { remoteFavorites, scheduler } = setup(options);
  const found = remoteFavorites.findRemoved(localIds, remoteStart);

  found.catch(() => { });
  await advanceAndSettle(scheduler, SETTLE_TIME);
  return found;
}

async function fetchFavoriteCount(fetchCount: FetchCount): Promise<number | null> {
  const { remoteFavorites, scheduler } = setup({ fetchCount });
  const counted = remoteFavorites.fetchCount();

  await advanceAndSettle(scheduler, SETTLE_TIME);
  return counted;
}

describe("Rule34RemoteFavorites", () => {
  test("gives every favorites fetch priority over the site's other pages", async() => {
    const { remoteFavorites, rule34, scheduler } = setup();
    const runs = [
      remoteFavorites.fetchAll(() => { }),
      remoteFavorites.findNew(["page0-0"]),
      remoteFavorites.findRemoved(["page0-0"], 0)
    ];

    await advanceAndSettle(scheduler, SETTLE_TIME);
    await Promise.all(runs);
    expect(rule34.prioritized).toBe(3);
  });

  describe("fetchCount", () => {
    test("counts the favorites of the page being viewed", async() => {
      const fetchCount = vi.fn(() => Promise.resolve(42));

      expect(await fetchFavoriteCount(fetchCount)).toBe(42);
      expect(fetchCount).toHaveBeenCalledWith(PAGE_ID);
    });

    test("retries a transient failure", async() => {
      const fetchCount = vi.fn<FetchCount>()
        .mockRejectedValueOnce(new Rule34Error("network"))
        .mockResolvedValue(42);

      expect(await fetchFavoriteCount(fetchCount)).toBe(42);
    });

    test("gives no count once the profile can't be read", async() => {
      const fetchCount = vi.fn<FetchCount>(() => Promise.reject(new Rule34Error("http", { status: 404 })));

      expect(await fetchFavoriteCount(fetchCount)).toBeNull();
      expect(fetchCount).toHaveBeenCalledOnce();
    });
  });

  describe("fetchAll", () => {
    test("delivers every page of the viewed favorites until an empty page", async() => {
      const fetchPage = createPageFetch(2);

      expect(getPostIds(await fetchAllFavorites({ fetchPage }))).toEqual(["page0-0", "page1-0", "page2-0"]);
      expect(fetchPage).toHaveBeenCalledWith(PAGE_ID, 0);
      expect(fetchPage).toHaveBeenCalledWith(PAGE_ID, 3);
    });

    test("starts from the favorites already on the page instead of fetching the first page", async() => {
      const fetchPage = createPageFetch(2);

      expect(getPostIds(await fetchAllFavorites({ fetchPage, firstPage: createPage(9) }))).toEqual(["page9-0", "page1-0", "page2-0"]);
      expect(fetchPage).not.toHaveBeenCalledWith(PAGE_ID, 0);
    });

    test("spaces requests by the first-attempt retry delay", async() => {
      const fetchPage = createPageFetch(1);
      const { remoteFavorites, scheduler } = setup({ fetchPage });
      const run = remoteFavorites.fetchAll(() => { });

      await advanceAndSettle(scheduler, computeRetryDelay(0, FETCH_DELAY) - 1);
      expect(fetchPage).toHaveBeenCalledTimes(1);

      await advanceAndSettle(scheduler, 1);
      expect(fetchPage).toHaveBeenCalledTimes(2);

      await advanceAndSettle(scheduler, SETTLE_TIME);
      await run;
    });

    test("stops at the first refused page instead of retrying it", async() => {
      const fetchPage = vi.fn<FetchPage>((_pageId, pageIndex) => (
        pageIndex === 0 ? Promise.reject(new Rule34Error("http", { status: 403 })) : Promise.resolve(createPage(pageIndex))
      ));

      await expect(fetchAllFavorites({ fetchPage })).rejects.toThrow(Rule34Error);
      expect(fetchPage).toHaveBeenCalledOnce();
    });

    test("gives up on a page after five transient failures", async() => {
      const fetchPage = vi.fn<FetchPage>(() => Promise.reject(new Rule34Error("http", { status: 429 })));

      await expect(fetchAllFavorites({ fetchPage })).rejects.toThrow(Rule34Error);
      expect(fetchPage).toHaveBeenCalledTimes(MAX_FETCH_ATTEMPTS);
    });
  });

  test("uses the favorites on screen only for the first fetch after the page loads", async() => {
    const fetchPage = createPageFetch(0);
    const { remoteFavorites, scheduler } = setup({ fetchPage, firstPage: createPage(9) });
    const runs = [remoteFavorites.findNew(["page9-0"]), remoteFavorites.findNew(["page0-0"])];

    await advanceAndSettle(scheduler, SETTLE_TIME);
    await Promise.all(runs);
    expect(fetchPage).toHaveBeenCalledOnce();
    expect(fetchPage).toHaveBeenCalledWith(PAGE_ID, 0);
  });

  describe("findNew", () => {
    test("finds the new favorites on the page on screen without fetching", async() => {
      const fetchPage = createPageFetch(0);
      const firstPage = [...createPage(8), ...createPage(9)];

      expect(await findNewFavoriteIds({ fetchPage, firstPage }, ["page9-0"])).toEqual(["page8-0"]);
      expect(fetchPage).not.toHaveBeenCalled();
    });

    test("retries a page that fails transiently", async() => {
      const fetchPage = vi.fn<FetchPage>()
        .mockRejectedValueOnce(new Rule34Error("network"))
        .mockRejectedValueOnce(new Rule34Error("http", { status: 503 }))
        .mockResolvedValue(createPage(0));

      expect(await findNewFavoriteIds({ fetchPage }, ["page0-0"])).toEqual([]);
      expect(fetchPage).toHaveBeenCalledTimes(3);
    });

    test("never retries a refused page", async() => {
      const fetchPage = vi.fn<FetchPage>(() => Promise.reject(new Rule34Error("http", { status: 403 })));

      await expect(findNewFavoriteIds({ fetchPage }, ["page0-0"])).rejects.toThrow(Rule34Error);
      expect(fetchPage).toHaveBeenCalledOnce();
    });
  });

  describe("findRemoved", () => {
    test("finds the local favorites the remote list no longer has", async() => {
      const remote = createPage(0, FAVORITES_PER_PAGE);
      const localIds = getPostIds(remote);
      const fetchPage = vi.fn<FetchPage>(() => Promise.resolve(remote.filter(post => post.id !== localIds[3])));

      expect(await findRemovedFavoriteIds({ fetchPage }, localIds)).toEqual([localIds[3]]);
    });

    test("finds removals below new favorites", async() => {
      const remote = createPage(0, 10);
      const localIds = getPostIds(remote).slice(2);
      const fetchPage = vi.fn<FetchPage>(() => Promise.resolve(remote.filter(post => post.id !== localIds[3])));

      expect(await findRemovedFavoriteIds({ fetchPage }, localIds, 2)).toEqual([localIds[3]]);
    });

    test("fetches the first page fresh instead of trusting the one on screen", async() => {
      const fetchPage = createPageFetch(0);

      expect(await findRemovedFavoriteIds({ fetchPage, firstPage: createPage(9) }, ["page0-0"])).toEqual([]);
      expect(fetchPage).toHaveBeenCalledWith(PAGE_ID, 0);
    });

    test("never retries a refused page", async() => {
      const fetchPage = vi.fn<FetchPage>(() => Promise.reject(new Rule34Error("http", { status: 403 })));

      await expect(findRemovedFavoriteIds({ fetchPage }, ["page0-0"])).rejects.toThrow(Rule34Error);
      expect(fetchPage).toHaveBeenCalledOnce();
    });
  });
});

describe("computeRetryDelay", () => {
  test("adds the flat fetch delay to a backoff of one for the first attempt", () => {
    expect(computeRetryDelay(0, FETCH_DELAY)).toBe(FETCH_DELAY + 1);
  });

  test("grows the backoff exponentially with the retry count", () => {
    const base = computeRetryDelay(1, 0);

    expect(base).toBeGreaterThan(1);
    expect(computeRetryDelay(2, 0)).toBe(base ** 2);
    expect(computeRetryDelay(3, 0)).toBe(base ** 3);
  });

  test("adds the flat fetch delay on every retry", () => {
    expect(computeRetryDelay(2, FETCH_DELAY)).toBe(computeRetryDelay(2, 0) + FETCH_DELAY);
  });
});
