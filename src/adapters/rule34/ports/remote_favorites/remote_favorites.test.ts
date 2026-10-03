import { Rule34RemoteFavorites, Rule34RemoteFavoritesDependencies, computeRetryDelay } from "@/adapters/rule34/ports/remote_favorites/remote_favorites";
import { describe, expect, test, vi } from "vitest";
import { FAVORITES_PER_PAGE } from "@/adapters/rule34/client/site/favorites_page/url";
import { MemoryRandom } from "@/adapters/memory/ports/random/random";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { Post } from "@/core/domain/post/post";
import { Rule34AddFavoriteAnswer } from "@/adapters/rule34/client/site/favorite_actions/favorite_actions";
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
  addAnswer?: Rule34AddFavoriteAnswer | null;
  removeSent?: boolean;
}

interface Setup {
  remoteFavorites: Rule34RemoteFavorites;
  rule34: Rule34 & { prioritized: number };
  scheduler: MemoryScheduler;
}

function createPage(index: number, size = 1): Post[] {
  return Array.from({ length: size }, (_, i) => createPost({ id: `page${index}-${i}` }));
}

function idsOf(posts: Post[]): string[] {
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
  firstPage = null,
  addAnswer = "added",
  removeSent = true
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
    },
    addFavorite: (): Promise<Rule34AddFavoriteAnswer | null> => Promise.resolve(addAnswer),
    removeFavorite: (): Promise<boolean> => Promise.resolve(removeSent)
  };
  return rule34;
}

function setup(options: ClientOptions = {}): Setup {
  const rule34 = createClient(options);
  const scheduler = new MemoryScheduler();
  const remoteFavorites = new Rule34RemoteFavorites({ rule34, scheduler, random: new MemoryRandom([1]) });
  return { remoteFavorites, rule34, scheduler };
}

async function deliveredFor(options: ClientOptions, knownIds: ReadonlySet<string>): Promise<Post[]> {
  const { remoteFavorites, scheduler } = setup(options);
  const delivered: Post[] = [];
  const run = remoteFavorites.fetchAllExcept(knownIds, posts => delivered.push(...posts));

  run.catch(() => { });
  await advanceAndSettle(scheduler, SETTLE_TIME);
  await run;
  return delivered;
}

async function countFor(fetchCount: FetchCount): Promise<number | null> {
  const { remoteFavorites, scheduler } = setup({ fetchCount });
  const counted = remoteFavorites.fetchCount();

  await advanceAndSettle(scheduler, SETTLE_TIME);
  return counted;
}

describe("Rule34RemoteFavorites", () => {
  test("gives every favorites fetch priority over the site's other pages", async() => {
    const { remoteFavorites, rule34, scheduler } = setup();
    const runs = [
      remoteFavorites.fetchAllExcept(new Set(), () => { }),
      remoteFavorites.fetchAllExcept(new Set(["known"]), () => { })
    ];

    await advanceAndSettle(scheduler, SETTLE_TIME);
    await Promise.all(runs);
    expect(rule34.prioritized).toBe(2);
  });

  describe("fetchCount", () => {
    test("counts the favorites of the page being viewed", async() => {
      const fetchCount = vi.fn(() => Promise.resolve(42));

      expect(await countFor(fetchCount)).toBe(42);
      expect(fetchCount).toHaveBeenCalledWith(PAGE_ID);
    });

    test("retries a transient failure", async() => {
      const fetchCount = vi.fn<FetchCount>()
        .mockRejectedValueOnce(new Rule34Error("network"))
        .mockResolvedValue(42);

      expect(await countFor(fetchCount)).toBe(42);
    });

    test("gives no count once the profile can't be read", async() => {
      const fetchCount = vi.fn<FetchCount>(() => Promise.reject(new Rule34Error("http", { status: 404 })));

      expect(await countFor(fetchCount)).toBeNull();
      expect(fetchCount).toHaveBeenCalledOnce();
    });
  });

  describe("fetchAllExcept with no known ids", () => {
    test("delivers every page of the viewed favorites until an empty page", async() => {
      const fetchPage = createPageFetch(2);

      expect(idsOf(await deliveredFor({ fetchPage }, new Set()))).toEqual(["page0-0", "page1-0", "page2-0"]);
      expect(fetchPage).toHaveBeenCalledWith(PAGE_ID, 0);
      expect(fetchPage).toHaveBeenCalledWith(PAGE_ID, 3);
    });

    test("starts from the favorites already on the page instead of fetching the first page", async() => {
      const fetchPage = createPageFetch(2);
      const delivered = await deliveredFor({ fetchPage, firstPage: createPage(9) }, new Set());

      expect(idsOf(delivered)).toEqual(["page9-0", "page1-0", "page2-0"]);
      expect(fetchPage).not.toHaveBeenCalledWith(PAGE_ID, 0);
    });

    test("spaces requests by the first-attempt retry delay", async() => {
      const fetchPage = createPageFetch(1);
      const { remoteFavorites, scheduler } = setup({ fetchPage });
      const run = remoteFavorites.fetchAllExcept(new Set(), () => { });

      await advanceAndSettle(scheduler, computeRetryDelay(0, FETCH_DELAY) - 1);
      expect(fetchPage).toHaveBeenCalledTimes(1);

      await advanceAndSettle(scheduler, 1);
      expect(fetchPage).toHaveBeenCalledTimes(2);

      await advanceAndSettle(scheduler, SETTLE_TIME);
      await run;
    });
  });

  describe("fetchAllExcept with known ids", () => {
    const KNOWN_IDS = new Set(["known"]);

    test("reads the first page from the favorites already on the page", async() => {
      const fetchPage = createPageFetch(1);

      expect(idsOf(await deliveredFor({ fetchPage, firstPage: createPage(9) }, KNOWN_IDS))).toEqual(["page9-0"]);
      expect(fetchPage).not.toHaveBeenCalled();
    });

    test("delivers unknown posts from pages until a page is not entirely unknown", async() => {
      const fetchPage = createPageFetch(1, FAVORITES_PER_PAGE);

      expect(await deliveredFor({ fetchPage }, new Set(["page1-0"]))).toHaveLength((FAVORITES_PER_PAGE * 2) - 1);
      expect(fetchPage).toHaveBeenCalledTimes(2);
      expect(fetchPage).toHaveBeenLastCalledWith(PAGE_ID, 1);
    });

    test("retries a page that fails transiently", async() => {
      const fetchPage = vi.fn<FetchPage>()
        .mockRejectedValueOnce(new Rule34Error("network"))
        .mockRejectedValueOnce(new Rule34Error("http", { status: 503 }))
        .mockResolvedValue(createPage(0));

      expect(idsOf(await deliveredFor({ fetchPage }, KNOWN_IDS))).toEqual(["page0-0"]);
      expect(fetchPage).toHaveBeenCalledTimes(3);
    });

    test("gives up after five transient failures", async() => {
      const fetchPage = vi.fn<FetchPage>(() => Promise.reject(new Rule34Error("network")));

      await expect(deliveredFor({ fetchPage }, KNOWN_IDS)).rejects.toThrow(Rule34Error);
      expect(fetchPage).toHaveBeenCalledTimes(MAX_FETCH_ATTEMPTS);
    });

    test("never retries a page it can't read", async() => {
      const fetchPage = vi.fn<FetchPage>(() => Promise.reject(new Rule34Error("malformed")));

      await expect(deliveredFor({ fetchPage }, KNOWN_IDS)).rejects.toThrow(Rule34Error);
      expect(fetchPage).toHaveBeenCalledOnce();
    });
  });

  describe("add and remove", () => {
    test("reports the site's answer to an add", async() => {
      expect(await setup({ addAnswer: "alreadyAdded" }).remoteFavorites.add("7")).toBe("alreadyAdded");
    });

    test("reports an add cancelled by a later remove", async() => {
      expect(await setup({ addAnswer: null }).remoteFavorites.add("7")).toBe("cancelled");
    });

    test("reports a sent remove as removed and one cancelled by a later add as cancelled", async() => {
      expect(await setup({ removeSent: true }).remoteFavorites.remove("8")).toBe("removed");
      expect(await setup({ removeSent: false }).remoteFavorites.remove("8")).toBe("cancelled");
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
