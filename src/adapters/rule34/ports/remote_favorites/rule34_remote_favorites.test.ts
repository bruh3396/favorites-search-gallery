import { Rule34RemoteFavorites, Rule34RemoteFavoritesDependencies } from "@/adapters/rule34/ports/remote_favorites/rule34_remote_favorites";
import { describe, expect, test, vi } from "vitest";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/memory_random_source";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/memory_scheduler";
import { Post } from "@/core/domain/post/post";
import { RULE34_PAGE_SIZE } from "@/adapters/rule34/client/rule34_page_size";
import { Rule34Error } from "@/adapters/rule34/client/rule34_error";
import { advanceAndSettle } from "@/testing/microtask_utilities";
import { createPost } from "@/testing/post";

const FAVORITES_OWNER_ID = "123";
const FETCH_DELAY = 1_000;
const MAX_FETCH_ATTEMPTS = 20;
const RETRY_BASE_DELAY = 1_500;
const SETTLE_TIME = 60_000;
const GIVE_UP_TIME = 20 * 60_000;

type Rule34 = Rule34RemoteFavoritesDependencies["rule34Client"];
type FetchPage = (userId: string, pageIndex: number) => Promise<Post[]>;
type FetchCount = (userId: string) => Promise<number>;

interface ClientOptions {
  fetchPage?: FetchPage;
  fetchCount?: FetchCount;
  firstPagePosts?: Post[] | null;
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
  firstPagePosts = null
}: ClientOptions): Rule34 & { prioritized: number } {
  const rule34Client = {
    prioritized: 0,
    readFirstFavoritesPage: (): Post[] | null => firstPagePosts,
    fetchFavoritesPage: fetchPage,
    fetchFavoriteCount: fetchCount,
    prioritizeFavorites: <T>(fetchFavorites: () => Promise<T>): Promise<T> => {
      rule34Client.prioritized += 1;
      return fetchFavorites();
    }
  };
  return rule34Client;
}

function setup(clientOptions: ClientOptions = {}, addAnswer = "3", fetch = (): Promise<Response> => Promise.resolve(new Response(addAnswer))): Setup {
  const rule34Client = createClient(clientOptions);
  const scheduler = new MemoryScheduler();
  const rule34Document = { readFavoritesOwnerId: (): string => FAVORITES_OWNER_ID };
  const remoteFavorites = new Rule34RemoteFavorites({
    rule34Client,
    rule34Document,
    fetch,
    scheduler,
    randomSource: new MemoryRandomSource([1])
  });
  return { remoteFavorites, rule34Client, scheduler };
}

async function fetchAllFavorites(clientOptions: ClientOptions, settleTime = SETTLE_TIME): Promise<Post[]> {
  const { remoteFavorites, scheduler } = setup(clientOptions);
  const deliveredPosts: Post[] = [];
  const run = remoteFavorites.fetchAll(posts => deliveredPosts.push(...posts));

  run.catch(() => { });
  await advanceAndSettle(scheduler, settleTime);
  await run;
  return deliveredPosts;
}

async function findNewPostIds(clientOptions: ClientOptions, localPostIds: string[], settleTime = SETTLE_TIME): Promise<string[]> {
  const { remoteFavorites, scheduler } = setup(clientOptions);
  const found = remoteFavorites.findNew(localPostIds);

  found.catch(() => { });
  await advanceAndSettle(scheduler, settleTime);
  return getPostIds(await found);
}

async function findMissingPostIds(
  clientOptions: ClientOptions,
  localPostIds: string[],
  { remoteStart = 0, settleTime = SETTLE_TIME }: { remoteStart?: number; settleTime?: number } = {}
): Promise<string[]> {
  const { remoteFavorites, scheduler } = setup(clientOptions);
  const found = remoteFavorites.findMissing(localPostIds, remoteStart);

  found.catch(() => { });
  await advanceAndSettle(scheduler, settleTime);
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

      expect(getPostIds(await fetchAllFavorites({ fetchPage, firstPagePosts: createPage(9) }))).toEqual(["page9-0", "page1-0", "page2-0"]);
      expect(fetchPage).not.toHaveBeenCalledWith(FAVORITES_OWNER_ID, 0);
    });

    test("spaces requests by the fetch delay", async() => {
      const fetchPage = createPageFetch(1);
      const { remoteFavorites, scheduler } = setup({ fetchPage });
      const run = remoteFavorites.fetchAll(() => { });

      await advanceAndSettle(scheduler, FETCH_DELAY - 1);
      expect(fetchPage).toHaveBeenCalledOnce();

      await advanceAndSettle(scheduler, 1);
      expect(fetchPage).toHaveBeenCalledTimes(2);

      await advanceAndSettle(scheduler, SETTLE_TIME);
      await run;
    });

    test("backs off longer before each retry of a failed page", async() => {
      const page0RequestedAt: number[] = [];
      const fetchPage = vi.fn<FetchPage>((_userId, pageIndex) => {
        if (pageIndex > 0) {
          return Promise.resolve([]);
        }
        page0RequestedAt.push(scheduler.now());
        return page0RequestedAt.length <= 2 ? Promise.reject(new Rule34Error("http", { status: 429 })) : Promise.resolve(createPage(0));
      });
      const { remoteFavorites, scheduler } = setup({ fetchPage });
      const run = remoteFavorites.fetchAll(() => { });

      await advanceAndSettle(scheduler, SETTLE_TIME);
      await run;
      expect(page0RequestedAt).toEqual([
        0,
        FETCH_DELAY + RETRY_BASE_DELAY,
        (2 * FETCH_DELAY) + (3 * RETRY_BASE_DELAY)
      ]);
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

    test.each([403, 429])("gives up on a page after twenty failures with http %i", async status => {
      const fetchPage = vi.fn<FetchPage>(() => Promise.reject(new Rule34Error("http", { status })));

      await expect(fetchAllFavorites({ fetchPage }, GIVE_UP_TIME)).rejects.toThrow(Rule34Error);
      expect(fetchPage).toHaveBeenCalledTimes(MAX_FETCH_ATTEMPTS);
    });
  });

  test("uses the favorites on screen only for the first fetch after the page loads", async() => {
    const fetchPage = createPageFetch(0);
    const { remoteFavorites, scheduler } = setup({ fetchPage, firstPagePosts: createPage(9) });
    const runs = [remoteFavorites.findNew(["page9-0"]), remoteFavorites.findNew(["page0-0"])];

    await advanceAndSettle(scheduler, SETTLE_TIME);
    await Promise.all(runs);
    expect(fetchPage).toHaveBeenCalledOnce();
    expect(fetchPage).toHaveBeenCalledWith(FAVORITES_OWNER_ID, 0);
  });

  describe("findNew", () => {
    test("finds the new favorites on the page on screen without fetching", async() => {
      const fetchPage = createPageFetch(0);
      const firstPagePosts = [...createPage(8), ...createPage(9)];

      expect(await findNewPostIds({ fetchPage, firstPagePosts }, ["page9-0"])).toEqual(["page8-0"]);
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

    test("gives up on a page refused twenty times", async() => {
      const fetchPage = vi.fn<FetchPage>(() => Promise.reject(new Rule34Error("http", { status: 403 })));

      await expect(findNewPostIds({ fetchPage }, ["page0-0"], GIVE_UP_TIME)).rejects.toThrow(Rule34Error);
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
      const remotePosts = createPage(0, RULE34_PAGE_SIZE.favorites);
      const localPostIds = getPostIds(remotePosts);
      const fetchPage = vi.fn<FetchPage>(() => Promise.resolve(remotePosts.filter(post => post.id !== localPostIds[3])));

      expect(await findMissingPostIds({ fetchPage }, localPostIds)).toEqual([localPostIds[3]]);
    });

    test("finds removals below new favorites", async() => {
      const remotePosts = createPage(0, 10);
      const localPostIds = getPostIds(remotePosts).slice(2);
      const fetchPage = vi.fn<FetchPage>(() => Promise.resolve(remotePosts.filter(post => post.id !== localPostIds[3])));

      expect(await findMissingPostIds({ fetchPage }, localPostIds, { remoteStart: 2 })).toEqual([localPostIds[3]]);
    });

    test("fetches the first page fresh instead of trusting the one on screen", async() => {
      const fetchPage = createPageFetch(0);

      expect(await findMissingPostIds({ fetchPage, firstPagePosts: createPage(9) }, ["page0-0"])).toEqual([]);
      expect(fetchPage).toHaveBeenCalledWith(FAVORITES_OWNER_ID, 0);
    });

    test("gives up on a page refused twenty times", async() => {
      const fetchPage = vi.fn<FetchPage>(() => Promise.reject(new Rule34Error("http", { status: 403 })));

      await expect(findMissingPostIds({ fetchPage }, ["page0-0"], { settleTime: GIVE_UP_TIME })).rejects.toThrow(Rule34Error);
      expect(fetchPage).toHaveBeenCalledTimes(MAX_FETCH_ATTEMPTS);
    });
  });

  describe("add", () => {
    test("counts a post the site already had as added", async() => {
      expect(await setup({}, "1").remoteFavorites.add("7")).toBe("added");
    });

    test("reports a refused add as failed", async() => {
      expect(await setup({}, "0").remoteFavorites.add("7")).toBe("failed");
    });

    test("reports a logged out add", async() => {
      expect(await setup({}, "2").remoteFavorites.add("7")).toBe("loggedOut");
    });

    test("reports a rejected request as failed", async() => {
      const { remoteFavorites } = setup({}, "3", () => Promise.reject(new TypeError("offline")));

      expect(await remoteFavorites.add("7")).toBe("failed");
    });

    test("reports an add cancelled by a later remove as failed", async() => {
      const { remoteFavorites, scheduler } = setup();
      const first = remoteFavorites.add("1");
      const second = remoteFavorites.add("2");

      await remoteFavorites.remove("2");
      await advanceAndSettle(scheduler, 1_000);
      expect(await first).toBe("added");
      expect(await second).toBe("failed");
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
