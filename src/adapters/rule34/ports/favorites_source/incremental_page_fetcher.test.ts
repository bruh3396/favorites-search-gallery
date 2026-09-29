import { describe, expect, test, vi } from "vitest";
import { IncrementalPageFetcher } from "@/adapters/rule34/ports/favorites_source/incremental_page_fetcher";
import { Post } from "@/core/domain/post/post";
import { createPost } from "@/testing/post";

const PAGE_SIZE = 50;

function createPartialPage(startId: number, count: number): Post[] {
  return Array.from({ length: count }, (_, i) => createPost({ id: String(startId + i) }));
}

function createFullPage(startId: number): Post[] {
  return createPartialPage(startId, PAGE_SIZE);
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

async function deliveredFor(fetch: (pageIndex: number) => Promise<Post[]>, seen: ReadonlySet<string>, firstPage?: Post[]): Promise<Post[][]> {
  const delivered: Post[][] = [];

  await new IncrementalPageFetcher(posts => delivered.push(posts), fetch, PAGE_SIZE, NO_DELAY, seen).fetchMissing(firstPage);
  return delivered;
}

describe("IncrementalPageFetcher", () => {
  test("delivers nothing when the first fetched page is empty", async() => {
    const { fetch, requested } = createPageFetcher([[]]);

    expect(await deliveredFor(fetch, new Set())).toEqual([]);
    expect(requested).toEqual([0]);
  });

  test("starts at page index 0 when no first page is provided", async() => {
    const { fetch, requested } = createPageFetcher([createPartialPage(0, 3)]);
    const delivered = await deliveredFor(fetch, new Set());

    expect(idsOf(delivered.flat())).toEqual(["0", "1", "2"]);
    expect(requested).toEqual([0]);
  });

  test("delivers each page as it is fetched and stops after a partial page", async() => {
    const { fetch, requested } = createPageFetcher([createFullPage(0), createFullPage(100), createPartialPage(200, 10)]);
    const delivered = await deliveredFor(fetch, new Set());

    expect(delivered.map(page => page.length)).toEqual([PAGE_SIZE, PAGE_SIZE, 10]);
    expect(requested).toEqual([0, 1, 2]);
  });

  test("filters out already stored posts", async() => {
    const { fetch } = createPageFetcher([createPartialPage(0, 5)]);
    const delivered = await deliveredFor(fetch, new Set(["1", "3"]));

    expect(idsOf(delivered.flat())).toEqual(["0", "2", "4"]);
  });

  test("stops when dedupe drops a full page below the page size", async() => {
    const first = createFullPage(0);
    const { fetch, requested } = createPageFetcher([first, createFullPage(100)]);
    const delivered = await deliveredFor(fetch, new Set([first[0].id]));

    expect(delivered.flat()).toHaveLength(PAGE_SIZE - 1);
    expect(requested).toEqual([0]);
  });

  describe("first page provided", () => {
    test("short-circuits without fetching when the first page's unseen count is below the page size", async() => {
      const { fetch, requested } = createPageFetcher([createFullPage(100)]);
      const delivered = await deliveredFor(fetch, new Set(), createPartialPage(0, 10));

      expect(idsOf(delivered.flat())).toEqual(idsOf(createPartialPage(0, 10)));
      expect(fetch).not.toHaveBeenCalled();
      expect(requested).toEqual([]);
    });

    test("continues from page index 1 when the first page is full", async() => {
      const { fetch, requested } = createPageFetcher([createFullPage(0), createPartialPage(100, 5)]);
      const delivered = await deliveredFor(fetch, new Set(), createFullPage(500));

      expect(delivered.flat()).toHaveLength(PAGE_SIZE + 5);
      expect(requested).toEqual([1]);
    });

    test("applies dedupe to the provided first page", async() => {
      const { fetch } = createPageFetcher([]);
      const delivered = await deliveredFor(fetch, new Set(["0", "5", "9"]), createPartialPage(0, 10));

      expect(idsOf(delivered.flat())).toEqual(["1", "2", "3", "4", "6", "7", "8"]);
    });
  });
});
