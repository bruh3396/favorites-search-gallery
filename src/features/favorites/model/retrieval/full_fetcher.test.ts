import { describe, expect, test, vi } from "vitest";
import { FavoritesFullFetcher } from "@/features/favorites/model/retrieval/full_fetcher";
import { Post } from "@/types/api";
import { createPost } from "@/testing/post";
import { flushMicrotasks } from "@/testing/async";

const NO_DELAY = (): number => 0;

type ResolvePosts = (posts: Post[]) => void;

function createPage(index: number): Post[] {
  return [createPost({ id: `page${index}` })];
}

function idsOf(batches: Post[][]): string[] {
  return batches.flat().map(post => post.id);
}

function tick(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

function createDeferredFetcher(lastIndex: number): {
  fetch: (index: number) => Promise<Post[]>;
  requested: number[];
  settle: (index: number) => Promise<void>;
} {
  const resolvers = new Map<number, ResolvePosts>();
  const requested: number[] = [];

  const fetch = vi.fn((index: number): Promise<Post[]> => {
    requested.push(index);
    return new Promise<Post[]>(resolve => resolvers.set(index, resolve));
  });

  async function settle(index: number): Promise<void> {
    while (!resolvers.has(index)) {
      await tick();
    }
    resolvers.get(index)!(index > lastIndex ? [] : createPage(index));
    await flushMicrotasks();
  }
  return { fetch, requested, settle };
}

describe("FavoritesFullFetcher", () => {
  test("delivers pages in index order when they complete in order", async() => {
    const delivered: Post[][] = [];
    const pages = createDeferredFetcher(2);
    const run = new FavoritesFullFetcher(posts => delivered.push(posts), pages.fetch, NO_DELAY).fetchAll();

    await flushMicrotasks();
    await pages.settle(0);
    await pages.settle(1);
    await pages.settle(2);
    await pages.settle(3);
    await run;

    expect(idsOf(delivered)).toEqual(["page0", "page1", "page2"]);
  });

  test("delivers in index order even when a later page completes first", async() => {
    const delivered: Post[][] = [];
    const pages = createDeferredFetcher(2);
    const run = new FavoritesFullFetcher(posts => delivered.push(posts), pages.fetch, NO_DELAY).fetchAll();

    await flushMicrotasks();
    await pages.settle(2);
    expect(delivered).toHaveLength(0);

    await pages.settle(1);
    expect(delivered).toHaveLength(0);

    await pages.settle(0);
    expect(idsOf(delivered)).toEqual(["page0", "page1", "page2"]);

    await pages.settle(3);
    await run;
  });

  test("delivers the provided first page immediately and begins fetching at index 1", async() => {
    const delivered: Post[][] = [];
    const pages = createDeferredFetcher(2);
    const first = [createPost({ id: "first" })];
    const run = new FavoritesFullFetcher(posts => delivered.push(posts), pages.fetch, NO_DELAY, first).fetchAll();

    await flushMicrotasks();
    expect(delivered).toEqual([first]);
    expect(pages.requested).not.toContain(0);

    await pages.settle(1);
    await pages.settle(2);
    await pages.settle(3);
    await run;

    expect(idsOf(delivered)).toEqual(["first", "page1", "page2"]);
  });

  test("retries a failed page and still delivers it in order", async() => {
    const delivered: Post[][] = [];
    const fetch = vi.fn()
      .mockImplementationOnce(() => Promise.reject(new Error("boom")))
      .mockImplementation((index: number) => Promise.resolve(index > 1 ? [] : createPage(index)));

    await new FavoritesFullFetcher(posts => delivered.push(posts), fetch, NO_DELAY).fetchAll();

    expect(idsOf(delivered)).toEqual(["page0", "page1"]);
    const page0Attempts = fetch.mock.calls.filter(([index]) => index === 0).length;

    expect(page0Attempts).toBe(2);
  });

  test("stops fetching once an empty page is reached", async() => {
    const delivered: Post[][] = [];
    const fetch = vi.fn((index: number) => Promise.resolve(index >= 2 ? [] : createPage(index)));

    await new FavoritesFullFetcher(posts => delivered.push(posts), fetch, NO_DELAY).fetchAll();
    expect(idsOf(delivered)).toEqual(["page0", "page1"]);
  });

  test("waits for in-flight pages after the last page is found before finishing", async() => {
    const delivered: Post[][] = [];
    const pages = createDeferredFetcher(0);
    let hasFinished = false;
    const run = new FavoritesFullFetcher(posts => delivered.push(posts), pages.fetch, NO_DELAY).fetchAll()
      .then(() => {
        hasFinished = true;
      });

    await flushMicrotasks();
    await pages.settle(1);
    await tick();
    expect(hasFinished).toBe(false);

    await pages.settle(0);

    for (const index of pages.requested.filter(i => i > 1)) {
      await pages.settle(index);
    }
    await run;

    expect(idsOf(delivered)).toEqual(["page0"]);
  });

  test("passes the retry count to the delay function so backoff can grow", async() => {
    const delivered: Post[][] = [];
    const seenRetryCounts: number[] = [];
    const delayForRetry = vi.fn((retryCount: number) => {
      seenRetryCounts.push(retryCount);
      return 0;
    });
    const fetch = vi.fn()
      .mockImplementationOnce(() => Promise.reject(new Error("boom")))
      .mockImplementation((index: number) => Promise.resolve(index > 0 ? [] : createPage(index)));

    await new FavoritesFullFetcher(posts => delivered.push(posts), fetch, delayForRetry).fetchAll();
    expect(seenRetryCounts).toContain(1);
  });
});
