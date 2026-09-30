import { Rule34RemoteFavorites, computeRetryDelay } from "@/adapters/rule34/ports/remote_favorites/remote_favorites";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { FAVORITES_PER_PAGE } from "@/adapters/rule34/client/site/favorites_page/fetcher";
import { Post } from "@/core/domain/post/post";
import { createPost } from "@/testing/post";

const PAGE_ID = "123";
const FETCH_DELAY = 1_000;
const FETCH_ATTEMPTS = 4;

function createPage(index: number, size = 1): Post[] {
  return Array.from({ length: size }, (_, i) => createPost({ id: `page${index}-${i}` }));
}

function idsOf(posts: Post[]): string[] {
  return posts.map(post => post.id);
}

function createPageFetch(lastIndex: number, size = 1): (pageId: string, pageIndex: number) => Promise<Post[]> {
  return vi.fn((_pageId: string, pageIndex: number) => Promise.resolve(pageIndex > lastIndex ? [] : createPage(pageIndex, size)));
}

function createClient(fetchPage: (pageId: string, pageIndex: number) => Promise<Post[]>, fetchCount: (pageId: string) => Promise<number | null>, addAnswer: string | null = "3", removeSent = true): ConstructorParameters<typeof Rule34RemoteFavorites>[0] & { prioritized: number } {
  const rule34 = {
    prioritized: 0,
    readFavoritesPageId: (): string => PAGE_ID,
    readFirstFavoritesPage: (): Post[] | null => null,
    fetchFavoritesPage: fetchPage,
    fetchFavoriteCount: fetchCount,
    prioritizeFavorites: <T>(fetchFavorites: () => Promise<T>): Promise<T> => {
      rule34.prioritized += 1;
      return fetchFavorites();
    },
    addFavorite: (): Promise<string | null> => Promise.resolve(addAnswer),
    removeFavorite: (): Promise<boolean> => Promise.resolve(removeSent)
  };
  return rule34;
}

function createAnsweringFavorites(addAnswer: string | null, removeSent = true): Rule34RemoteFavorites {
  return new Rule34RemoteFavorites(createClient(createPageFetch(0), () => Promise.resolve(null), addAnswer, removeSent), PAGE_ID, null);
}

function createRemoteFavorites(fetchPage: (pageId: string, pageIndex: number) => Promise<Post[]>, fetchCount: (pageId: string) => Promise<number | null> = () => Promise.resolve(null), firstPageFavorites: Post[] | null = null): Rule34RemoteFavorites {
  return new Rule34RemoteFavorites(createClient(fetchPage, fetchCount), PAGE_ID, firstPageFavorites, FETCH_DELAY, FETCH_ATTEMPTS);
}

function collectMissing(source: Rule34RemoteFavorites, knownIds: ReadonlySet<string>): { run: Promise<void>; delivered: Post[] } {
  const delivered: Post[] = [];
  return { run: source.fetchAllExcept(knownIds, posts => delivered.push(...posts)), delivered };
}

describe("Rule34RemoteFavorites", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("gives every favorites fetch priority over the site's other pages", async() => {
    const rule34 = createClient(createPageFetch(0), () => Promise.resolve(null));
    const source = new Rule34RemoteFavorites(rule34, PAGE_ID, null, FETCH_DELAY, FETCH_ATTEMPTS);
    const runs = [source.fetchAllExcept(new Set(), () => { }), source.fetchAllExcept(new Set(["known"]), () => { })];

    await vi.runAllTimersAsync();
    await Promise.all(runs);
    expect(rule34.prioritized).toBe(2);
  });

  test("reads its page id and the favorites already on the page from the site", () => {
    const rule34 = createClient(createPageFetch(0), () => Promise.resolve(null));
    const readFirstFavoritesPage = vi.spyOn(rule34, "readFirstFavoritesPage");
    const fetchCount = vi.spyOn(rule34, "fetchFavoriteCount");

    new Rule34RemoteFavorites(rule34).fetchCount();
    expect(readFirstFavoritesPage).toHaveBeenCalledOnce();
    expect(fetchCount).toHaveBeenCalledWith(PAGE_ID);
  });

  describe("fetchCount", () => {
    test("counts the favorites of the configured page id", async() => {
      const fetchCount = vi.fn(() => Promise.resolve(42));

      expect(await createRemoteFavorites(createPageFetch(0), fetchCount).fetchCount()).toBe(42);
      expect(fetchCount).toHaveBeenCalledWith(PAGE_ID);
    });
  });

  describe("fetchAllExcept with no known ids", () => {
    test("delivers every page for the configured page id until an empty page", async() => {
      const fetchPage = createPageFetch(2);
      const { run, delivered } = collectMissing(createRemoteFavorites(fetchPage), new Set());

      await vi.runAllTimersAsync();
      await run;

      expect(idsOf(delivered)).toEqual(["page0-0", "page1-0", "page2-0"]);
      expect(fetchPage).toHaveBeenCalledWith(PAGE_ID, 0);
      expect(fetchPage).toHaveBeenCalledWith(PAGE_ID, 3);
    });

    test("starts from the favorites already on the page instead of fetching the first page", async() => {
      const fetchPage = createPageFetch(2);
      const { run, delivered } = collectMissing(createRemoteFavorites(fetchPage, undefined, createPage(9)), new Set());

      await vi.runAllTimersAsync();
      await run;

      expect(idsOf(delivered)).toEqual(["page9-0", "page1-0", "page2-0"]);
      expect(fetchPage).not.toHaveBeenCalledWith(PAGE_ID, 0);
    });

    test("spaces requests by the first-attempt retry delay", async() => {
      const fetchPage = createPageFetch(1);
      const { run } = collectMissing(createRemoteFavorites(fetchPage), new Set());

      await vi.advanceTimersByTimeAsync(computeRetryDelay(0, FETCH_DELAY) - 1);
      expect(fetchPage).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(1);
      expect(fetchPage).toHaveBeenCalledTimes(2);

      await vi.runAllTimersAsync();
      await run;
    });
  });

  describe("fetchAllExcept with known ids", () => {
    const KNOWN_IDS = new Set(["known"]);

    test("reads the first page from the favorites already on the page", async() => {
      const fetchPage = createPageFetch(1);
      const { run, delivered } = collectMissing(createRemoteFavorites(fetchPage, undefined, createPage(9)), KNOWN_IDS);

      await vi.runAllTimersAsync();
      await run;

      expect(idsOf(delivered)).toEqual(["page9-0"]);
      expect(fetchPage).not.toHaveBeenCalled();
    });

    test("delivers unknown posts from pages until a page is not entirely unknown", async() => {
      const fetchPage = createPageFetch(1, FAVORITES_PER_PAGE);
      const { run, delivered } = collectMissing(createRemoteFavorites(fetchPage), new Set(["page1-0"]));

      await vi.runAllTimersAsync();
      await run;

      expect(delivered).toHaveLength((FAVORITES_PER_PAGE * 2) - 1);
      expect(fetchPage).toHaveBeenCalledTimes(2);
      expect(fetchPage).toHaveBeenLastCalledWith(PAGE_ID, 1);
    });

    test("retries a failing page with backoff", async() => {
      const fetchPage = vi.fn()
        .mockRejectedValueOnce(new Error("boom"))
        .mockRejectedValueOnce(new Error("boom"))
        .mockResolvedValue(createPage(0));
      const { run, delivered } = collectMissing(createRemoteFavorites(fetchPage), KNOWN_IDS);

      await vi.runAllTimersAsync();
      await run;

      expect(idsOf(delivered)).toEqual(["page0-0"]);
      expect(fetchPage).toHaveBeenCalledTimes(3);
    });

    test("gives up after the configured number of attempts", async() => {
      const fetchPage = vi.fn().mockRejectedValue(new Error("boom"));
      const run = expect(collectMissing(createRemoteFavorites(fetchPage), KNOWN_IDS).run).rejects.toThrow("boom");

      await vi.runAllTimersAsync();
      await run;

      expect(fetchPage).toHaveBeenCalledTimes(FETCH_ATTEMPTS);
    });
  });

  describe("add and remove", () => {
    test.each([
      ["0", "error"],
      ["1", "alreadyAdded"],
      ["2", "loggedOut"],
      ["3", "added"],
      ["?", "error"]
    ])("reads the site's add answer %s as %s", async(siteAnswer, result) => {
      expect(await createAnsweringFavorites(siteAnswer).add("7")).toBe(result);
    });

    test("reports an add cancelled by a later remove", async() => {
      expect(await createAnsweringFavorites(null).add("7")).toBe("cancelled");
    });

    test("reports a sent remove as removed and one cancelled by a later add as cancelled", async() => {
      expect(await createAnsweringFavorites("3", true).remove("8")).toBe("removed");
      expect(await createAnsweringFavorites("3", false).remove("8")).toBe("cancelled");
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
