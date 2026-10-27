import { Rule34RemoteFavorites, Rule34RemoteFavoritesDependencies } from "@/adapters/rule34/ports/remote_favorites/rule34_remote_favorites";
import { describe, expect, test, vi } from "vitest";
import { RULE34_FAVORITES_PER_PAGE } from "@/adapters/rule34/client/rule34_url_builder";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/memory_random_source";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/memory_scheduler";
import { Post } from "@/core/domain/post/post";
import { Rule34Error } from "@/adapters/rule34/client/rule34_error";
import { advanceAndSettle } from "@/testing/async";
import { createPost } from "@/testing/post";

const FAVORITES_OWNER_ID = "123";
const FETCH_DELAY = 1_000;
const MAX_FETCH_ATTEMPTS = 5;
const SETTLE_TIME = 60_000;

type Rule34 = Rule34RemoteFavoritesDependencies["rule34Client"];
type FetchPage = (userId: string, pageIndex: number) => Promise<Post[]>;
type FetchCount = (userId: string) => Promise<number>;

interface ClientOptions {
  fetchPage?: FetchPage;
  fetchCount?: FetchCount;
  firstPage?: Post[] | null;
}

interface Setup {
  remoteFavorites: Rule34RemoteFavorites;
  rule34Client: Rule34 & { prioritized: number };
  scheduler: MemoryScheduler;
}

function createPage(index: number, size = 1): Post[] {
  return Array.from({ length: size }, (_, i) => createPost({ id: `page${index}-${i}` }));
}

function getPostIds(posts: Post[]): string[] {
  return posts.map(post => post.id);
}

function createPageFetch(lastIndex: number, size = 1): FetchPage {
  return vi.fn((_userId: string, pageIndex: number) => (
    Promise.resolve(pageIndex > lastIndex ? [] : createPage(pageIndex, size))
  ));
}

function createClient({
  fetchPage = createPageFetch(0),
  fetchCount = (): Promise<number> => Promise.resolve(0),
  firstPage = null
}: ClientOptions): Rule34 & { prioritized: number } {
  const rule34Client = {
    prioritized: 0,
    readFirstFavoritesPage: (): Post[] | null => firstPage,
    fetchFavoritesPage: fetchPage,
    fetchFavoriteCount: fetchCount,
    prioritizeFavorites: <T>(fetchFavorites: () => Promise<T>): Promise<T> => {
      rule34Client.prioritized += 1;
      return fetchFavorites();
    }
  };
  return rule34Client;
}

function setup(options: ClientOptions = {}, addAnswer = "3"): Setup {
  const rule34Client = createClient(options);
  const scheduler = new MemoryScheduler();
  const rule34Document = { readFavoritesOwnerId: (): string => FAVORITES_OWNER_ID };
  const remoteFavorites = new Rule34RemoteFavorites({
    rule34Client,
    rule34Document,
    fetch: (): Promise<Response> => Promise.resolve(new Response(addAnswer)),
    scheduler,
    randomSource: new MemoryRandomSource([1])
  });
  return { remoteFavorites, rule34Client, scheduler };
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

async function findNewPostIds(options: ClientOptions, localPostIds: string[]): Promise<string[]> {
  const { remoteFavorites, scheduler } = setup(options);
  const found = remoteFavorites.findNew(localPostIds);

  found.catch(() => { });
  await advanceAndSettle(scheduler, SETTLE_TIME);
  return getPostIds(await found);
}

async function findMissingPostIds(options: ClientOptions, localPostIds: string[], remoteStart = 0): Promise<string[]> {
  const { remoteFavorites, scheduler } = setup(options);
  const found = remoteFavorites.findMissing(localPostIds, remoteStart);

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
    const { remoteFavorites, rule34Client, scheduler } = setup();
    const runs = [
      remoteFavorites.fetchAll(() => { }),
      remoteFavorites.findNew(["page0-0"]),
      remoteFavorites.findMissing(["page0-0"], 0)
    ];

    await advanceAndSettle(scheduler, SETTLE_TIME);
    await Promise.all(runs);
    expect(rule34Client.prioritized).toBe(3);
  });

  describe("fetchCount", () => {
    test("counts the favorites of the page being viewed", async() => {
      const fetchCount = vi.fn(() => Promise.resolve(42));

      expect(await fetchFavoriteCount(fetchCount)).toBe(42);
      expect(fetchCount).toHaveBeenCalledWith(FAVORITES_OWNER_ID);
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
      expect(fetchPage).toHaveBeenCalledWith(FAVORITES_OWNER_ID, 0);
      expect(fetchPage).toHaveBeenCalledWith(FAVORITES_OWNER_ID, 3);
    });

    test("starts from the favorites already on the page instead of fetching the first page", async() => {
      const fetchPage = createPageFetch(2);

      expect(getPostIds(await fetchAllFavorites({ fetchPage, firstPage: createPage(9) }))).toEqual(["page9-0", "page1-0", "page2-0"]);
      expect(fetchPage).not.toHaveBeenCalledWith(FAVORITES_OWNER_ID, 0);
    });

    test("spaces requests by the first-attempt retry delay", async() => {
      const fetchPage = createPageFetch(1);
      const { remoteFavorites, scheduler } = setup({ fetchPage });
      const run = remoteFavorites.fetchAll(() => { });

      await advanceAndSettle(scheduler, FETCH_DELAY);
      expect(fetchPage).toHaveBeenCalledOnce();

      await advanceAndSettle(scheduler, 1);
      expect(fetchPage).toHaveBeenCalledTimes(2);

      await advanceAndSettle(scheduler, SETTLE_TIME);
      await run;
    });

    test("waits longer after a page's second failure than after its first", async() => {
      const requestedAt: number[] = [];
      const fetchPage = vi.fn<FetchPage>((_userId, pageIndex) => {
        requestedAt.push(scheduler.now());

        if (pageIndex === 0 && requestedAt.length <= 2) {
          return Promise.reject(new Rule34Error("http", { status: 429 }));
        }
        return Promise.resolve(pageIndex > 0 ? [] : createPage(pageIndex));
      });
      const { remoteFavorites, scheduler } = setup({ fetchPage });
      const run = remoteFavorites.fetchAll(() => { });

      await advanceAndSettle(scheduler, SETTLE_TIME);
      await run;
      const [first, firstRetry, secondRetry, nextPage] = requestedAt;

      expect(nextPage - secondRetry).toBeGreaterThan(secondRetry - firstRetry);
      expect(secondRetry - firstRetry).toBeGreaterThanOrEqual(firstRetry - first);
    });

    test("keeps going past a page refused once", async() => {
      let wasRefused = false;
      const fetchPage = vi.fn<FetchPage>((_userId, pageIndex) => {
        if (pageIndex === 1 && !wasRefused) {
          wasRefused = true;
          return Promise.reject(new Rule34Error("http", { status: 403 }));
        }
        return Promise.resolve(pageIndex > 2 ? [] : createPage(pageIndex));
      });

      expect(getPostIds(await fetchAllFavorites({ fetchPage }))).toEqual(["page0-0", "page1-0", "page2-0"]);
    });

    test.each([403, 429])("gives up on a page after five failures with http %i", async status => {
      const fetchPage = vi.fn<FetchPage>(() => Promise.reject(new Rule34Error("http", { status })));

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
    expect(fetchPage).toHaveBeenCalledWith(FAVORITES_OWNER_ID, 0);
  });

  describe("findNew", () => {
    test("finds the new favorites on the page on screen without fetching", async() => {
      const fetchPage = createPageFetch(0);
      const firstPage = [...createPage(8), ...createPage(9)];

      expect(await findNewPostIds({ fetchPage, firstPage }, ["page9-0"])).toEqual(["page8-0"]);
      expect(fetchPage).not.toHaveBeenCalled();
    });

    test("retries a page that fails", async() => {
      const fetchPage = vi.fn<FetchPage>()
        .mockRejectedValueOnce(new Rule34Error("network"))
        .mockRejectedValueOnce(new Rule34Error("http", { status: 403 }))
        .mockRejectedValueOnce(new Rule34Error("http", { status: 503 }))
        .mockResolvedValue(createPage(0));

      expect(await findNewPostIds({ fetchPage }, ["page0-0"])).toEqual([]);
      expect(fetchPage).toHaveBeenCalledTimes(4);
    });

    test("gives up on a page refused five times", async() => {
      const fetchPage = vi.fn<FetchPage>(() => Promise.reject(new Rule34Error("http", { status: 403 })));

      await expect(findNewPostIds({ fetchPage }, ["page0-0"])).rejects.toThrow(Rule34Error);
      expect(fetchPage).toHaveBeenCalledTimes(MAX_FETCH_ATTEMPTS);
    });

    test("never retries a missing page", async() => {
      const fetchPage = vi.fn<FetchPage>(() => Promise.reject(new Rule34Error("http", { status: 404 })));

      await expect(findNewPostIds({ fetchPage }, ["page0-0"])).rejects.toThrow(Rule34Error);
      expect(fetchPage).toHaveBeenCalledOnce();
    });
  });

  describe("findMissing", () => {
    test("finds the local favorites the remote list no longer has", async() => {
      const remote = createPage(0, RULE34_FAVORITES_PER_PAGE);
      const localPostIds = getPostIds(remote);
      const fetchPage = vi.fn<FetchPage>(() => Promise.resolve(remote.filter(post => post.id !== localPostIds[3])));

      expect(await findMissingPostIds({ fetchPage }, localPostIds)).toEqual([localPostIds[3]]);
    });

    test("finds removals below new favorites", async() => {
      const remote = createPage(0, 10);
      const localPostIds = getPostIds(remote).slice(2);
      const fetchPage = vi.fn<FetchPage>(() => Promise.resolve(remote.filter(post => post.id !== localPostIds[3])));

      expect(await findMissingPostIds({ fetchPage }, localPostIds, 2)).toEqual([localPostIds[3]]);
    });

    test("fetches the first page fresh instead of trusting the one on screen", async() => {
      const fetchPage = createPageFetch(0);

      expect(await findMissingPostIds({ fetchPage, firstPage: createPage(9) }, ["page0-0"])).toEqual([]);
      expect(fetchPage).toHaveBeenCalledWith(FAVORITES_OWNER_ID, 0);
    });

    test("gives up on a page refused five times", async() => {
      const fetchPage = vi.fn<FetchPage>(() => Promise.reject(new Rule34Error("http", { status: 403 })));

      await expect(findMissingPostIds({ fetchPage }, ["page0-0"])).rejects.toThrow(Rule34Error);
      expect(fetchPage).toHaveBeenCalledTimes(MAX_FETCH_ATTEMPTS);
    });
  });

  describe("add", () => {
    test("counts a post the site already had as added", async() => {
      expect(await setup({}, "1").remoteFavorites.add("7")).toBe(true);
    });

    test("reports a refused add as not added", async() => {
      expect(await setup({}, "2").remoteFavorites.add("7")).toBe(false);
    });

    test("reports an add cancelled by a later remove as not added", async() => {
      const { remoteFavorites, scheduler } = setup();
      const first = remoteFavorites.add("1");
      const second = remoteFavorites.add("2");

      await remoteFavorites.remove("2");
      await advanceAndSettle(scheduler, 1_000);
      expect(await first).toBe(true);
      expect(await second).toBe(false);
    });
  });

  describe("remove", () => {
    test("reports a sent remove as removed and one cancelled by a later add as not removed", async() => {
      const { remoteFavorites, scheduler } = setup();
      const first = remoteFavorites.remove("1");
      const second = remoteFavorites.remove("2");

      await remoteFavorites.add("2");
      await advanceAndSettle(scheduler, 1_000);
      expect(await first).toBe(true);
      expect(await second).toBe(false);
    });
  });
});
