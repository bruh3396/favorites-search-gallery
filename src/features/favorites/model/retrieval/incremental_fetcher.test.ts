import { describe, expect, test, vi } from "vitest";
import { FAVORITES_PER_PAGE } from "@/lib/constants";
import { FavoritesIncrementalFetcher } from "@/features/favorites/model/retrieval/incremental_fetcher";
import { Post } from "@/types/api";
import { createPost } from "@/testing/post";

function createPartialPage(startId: number, count: number): Post[] {
  return Array.from({ length: count }, (_, i) => createPost({ id: String(startId + i) }));
}

function createFullPage(startId: number): Post[] {
  return createPartialPage(startId, FAVORITES_PER_PAGE);
}

function createPageFetcher(pages: Post[][]): { fetch: (pageIndex: number) => Promise<Post[]>; requested: number[] } {
  const requested: number[] = [];
  return {
    requested,
    fetch: vi.fn((pageIndex: number) => {
      requested.push(pageIndex);
      return Promise.resolve(pages[pageIndex] ?? []);
    })
  };
}

function idsOf(posts: Post[]): string[] {
  return posts.map(p => p.id);
}

const NO_DELAY = 0;

describe("FavoritesIncrementalFetcher", () => {
  test("returns nothing when the first fetched page is empty", async() => {
    const { fetch, requested } = createPageFetcher([[]]);
    const fetcher = new FavoritesIncrementalFetcher(fetch, NO_DELAY, new Set());
    const result = await fetcher.fetchNew();

    expect(result).toEqual([]);
    expect(requested).toEqual([0]);
  });

  test("starts at page index 0 when no first page is provided", async() => {
    const { fetch, requested } = createPageFetcher([createPartialPage(0, 3)]);
    const fetcher = new FavoritesIncrementalFetcher(fetch, NO_DELAY, new Set());
    const result = await fetcher.fetchNew();

    expect(idsOf(result)).toEqual(["0", "1", "2"]);
    expect(requested).toEqual([0]);
  });

  test("stops after a partial page and advances the page index in order", async() => {
    const { fetch, requested } = createPageFetcher([createFullPage(0), createFullPage(100), createPartialPage(200, 10)]);
    const fetcher = new FavoritesIncrementalFetcher(fetch, NO_DELAY, new Set());
    const result = await fetcher.fetchNew();

    expect(result).toHaveLength((FAVORITES_PER_PAGE * 2) + 10);
    expect(requested).toEqual([0, 1, 2]);
  });

  test("filters out already stored posts", async() => {
    const stored = new Set(["1", "3"]);
    const { fetch } = createPageFetcher([createPartialPage(0, 5)]);
    const fetcher = new FavoritesIncrementalFetcher(fetch, NO_DELAY, stored);
    const result = await fetcher.fetchNew();

    expect(idsOf(result)).toEqual(["0", "2", "4"]);
  });

  test("stops when dedupe drops a full page below the page size", async() => {
    const first = createFullPage(0);
    const stored = new Set([first[0].id]);
    const { fetch, requested } = createPageFetcher([first, createFullPage(100)]);
    const fetcher = new FavoritesIncrementalFetcher(fetch, NO_DELAY, stored);
    const result = await fetcher.fetchNew();

    expect(result).toHaveLength(FAVORITES_PER_PAGE - 1);
    expect(requested).toEqual([0]);
  });

  describe("first page provided", () => {
    test("short-circuits without fetching when the first page's unseen count is below the page size", async() => {
      const { fetch, requested } = createPageFetcher([createFullPage(100)]);
      const fetcher = new FavoritesIncrementalFetcher(fetch, NO_DELAY, new Set());

      const result = await fetcher.fetchNew(createPartialPage(0, 10));

      expect(idsOf(result)).toEqual(idsOf(createPartialPage(0, 10)));
      expect(fetch).not.toHaveBeenCalled();
      expect(requested).toEqual([]);
    });

    test("continues from page index 1 when the first page is full", async() => {
      const { fetch, requested } = createPageFetcher([createFullPage(0), createPartialPage(100, 5)]);
      const fetcher = new FavoritesIncrementalFetcher(fetch, NO_DELAY, new Set());

      const result = await fetcher.fetchNew(createFullPage(500));

      expect(result).toHaveLength(FAVORITES_PER_PAGE + 5);
      expect(requested).toEqual([1]);
    });

    test("applies dedupe to the provided first page", async() => {
      const provided = createPartialPage(0, 10);
      const stored = new Set(["0", "5", "9"]);
      const { fetch } = createPageFetcher([]);
      const fetcher = new FavoritesIncrementalFetcher(fetch, NO_DELAY, stored);

      const result = await fetcher.fetchNew(provided);

      expect(idsOf(result)).toEqual(["1", "2", "3", "4", "6", "7", "8"]);
    });
  });
});
