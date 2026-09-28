import { Post } from "@/core/domain/post/post";
import { Rule34FavoritesSource, computeRetryDelay, onFirstFavoritesPage } from "@/adapters/rule34/favorites_source/favorites_source";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { FAVORITES_PER_PAGE } from "@/adapters/rule34/client/favorites_page/favorites_page";
import { Rule34NetworkConfig } from "@/adapters/rule34/client/network_config";
import { createPost } from "@/testing/post";

const PAGE_ID = "123";

function createPage(index: number, size = 1): Post[] {
  return Array.from({ length: size }, (_, i) => createPost({ id: `page${index}-${i}` }));
}

function idsOf(posts: Post[]): string[] {
  return posts.map(post => post.id);
}

function createPageFetch(lastIndex: number, size = 1): (pageId: string, pageIndex: number) => Promise<Post[]> {
  return vi.fn((_pageId: string, pageIndex: number) => Promise.resolve(pageIndex > lastIndex ? [] : createPage(pageIndex, size)));
}

function createSource(fetchPage: (pageId: string, pageIndex: number) => Promise<Post[]>, fetchCount: (pageId: string) => Promise<number | null> = () => Promise.resolve(null), firstPageFavorites: Post[] | null = null): Rule34FavoritesSource {
  return new Rule34FavoritesSource(PAGE_ID, fetchPage, fetchCount, firstPageFavorites, () => { });
}

describe("Rule34FavoritesSource", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("count", () => {
    test("counts the favorites of the configured page id", async() => {
      const fetchCount = vi.fn(() => Promise.resolve(42));

      expect(await createSource(createPageFetch(0), fetchCount).count()).toBe(42);
      expect(fetchCount).toHaveBeenCalledWith(PAGE_ID);
    });
  });

  describe("fetchAll", () => {
    test("delivers every page for the configured page id until an empty page", async() => {
      const fetchPage = createPageFetch(2);
      const delivered: Post[] = [];
      const run = createSource(fetchPage).fetchAll(posts => delivered.push(...posts));

      await vi.runAllTimersAsync();
      await run;

      expect(idsOf(delivered)).toEqual(["page0-0", "page1-0", "page2-0"]);
      expect(fetchPage).toHaveBeenCalledWith(PAGE_ID, 0);
      expect(fetchPage).toHaveBeenCalledWith(PAGE_ID, 3);
    });

    test("starts from the favorites already on the page instead of fetching the first page", async() => {
      const fetchPage = createPageFetch(2);
      const delivered: Post[] = [];
      const run = createSource(fetchPage, undefined, createPage(9)).fetchAll(posts => delivered.push(...posts));

      await vi.runAllTimersAsync();
      await run;

      expect(idsOf(delivered)).toEqual(["page9-0", "page1-0", "page2-0"]);
      expect(fetchPage).not.toHaveBeenCalledWith(PAGE_ID, 0);
    });

    test("spaces requests by the first-attempt retry delay", async() => {
      const fetchPage = createPageFetch(1);
      const run = createSource(fetchPage).fetchAll(() => { });

      await vi.advanceTimersByTimeAsync(computeRetryDelay(0) - 1);
      expect(fetchPage).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(1);
      expect(fetchPage).toHaveBeenCalledTimes(2);

      await vi.runAllTimersAsync();
      await run;
    });
  });

  describe("fetchNew", () => {
    test("reads the first page from the favorites already on the page", async() => {
      const fetchPage = createPageFetch(1);
      const run = createSource(fetchPage, undefined, createPage(9)).fetchNew(new Set());

      await vi.runAllTimersAsync();

      expect(idsOf(await run)).toEqual(["page9-0"]);
      expect(fetchPage).not.toHaveBeenCalled();
    });

    test("returns unseen posts from pages until a page is not entirely new", async() => {
      const fetchPage = createPageFetch(1, FAVORITES_PER_PAGE);
      const run = createSource(fetchPage).fetchNew(new Set(["page1-0"]));

      await vi.runAllTimersAsync();

      expect(await run).toHaveLength((FAVORITES_PER_PAGE * 2) - 1);
      expect(fetchPage).toHaveBeenCalledTimes(2);
      expect(fetchPage).toHaveBeenLastCalledWith(PAGE_ID, 1);
    });

    test("retries a failing page with backoff", async() => {
      const fetchPage = vi.fn()
        .mockRejectedValueOnce(new Error("boom"))
        .mockRejectedValueOnce(new Error("boom"))
        .mockResolvedValue(createPage(0));
      const run = createSource(fetchPage).fetchNew(new Set());

      await vi.runAllTimersAsync();

      expect(idsOf(await run)).toEqual(["page0-0"]);
      expect(fetchPage).toHaveBeenCalledTimes(3);
    });

    test("gives up after the configured number of attempts", async() => {
      const fetchPage = vi.fn().mockRejectedValue(new Error("boom"));
      const run = expect(createSource(fetchPage).fetchNew(new Set())).rejects.toThrow("boom");

      await vi.runAllTimersAsync();
      await run;

      expect(fetchPage).toHaveBeenCalledTimes(Rule34NetworkConfig.favoritesPageFetchRetries);
    });
  });
});

describe("computeRetryDelay", () => {
  const { favoritesPageRetryBackoffBase: base, favoritesPageFetchDelay: delay } = Rule34NetworkConfig;

  test("adds the flat fetch delay to the base for the first attempt", () => {
    expect(computeRetryDelay(0)).toBe(delay + 1);
  });

  test("grows the backoff exponentially with the retry count", () => {
    expect(computeRetryDelay(1)).toBe((base ** 1) + delay);
    expect(computeRetryDelay(2)).toBe((base ** 2) + delay);
    expect(computeRetryDelay(3)).toBe((base ** 3) + delay);
  });

  test("is monotonically increasing in the retry count", () => {
    expect(computeRetryDelay(2)).toBeGreaterThan(computeRetryDelay(1));
    expect(computeRetryDelay(1)).toBeGreaterThan(computeRetryDelay(0));
  });
});

describe("onFirstFavoritesPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test.each([
    ["page=favorites&id=1", true],
    ["page=favorites&id=1&pid=0", true],
    ["page=favorites&id=1&pid=50", false],
    ["page=post&s=list", false]
  ])("%s → %s", (query, expected) => {
    vi.stubGlobal("location", { href: `https://rule34.xxx/index.php?${query}` });

    expect(onFirstFavoritesPage()).toBe(expected);
  });
});
