import { advanceAndSettle, flushMicrotasks } from "@/testing/async";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/memory_scheduler";
import { Post } from "@/core/domain/post/post";
import { Rule34AllFavoritesFetcher } from "@/adapters/rule34/ports/remote_favorites/rule34_all_favorites_fetcher";
import { createPost } from "@/testing/post";

const NO_DELAY = (): number => 0;
const REQUEST_STEP = 10;
const POLL_STEP = 200;
const MAX_POLLS = 1_000;

type ResolvePosts = (posts: Post[]) => void;

let scheduler: MemoryScheduler;

beforeEach(() => {
  scheduler = new MemoryScheduler();
});

function createPage(index: number): Post[] {
  return [createPost({ id: `page${index}` })];
}

function flattenPostIds(batches: Post[][]): string[] {
  return batches.flat().map(post => post.id);
}

async function runToEnd(run: Promise<void>): Promise<void> {
  let isDone = false;

  run.then(() => {
    isDone = true;
  }, () => {
    isDone = true;
  });

  for (let polls = 0; polls < MAX_POLLS; polls += 1) {
    if (isDone) {
      return run;
    }
    await advanceAndSettle(scheduler, POLL_STEP);
  }
  throw new Error("fetchAll never finished");
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
      await advanceAndSettle(scheduler, REQUEST_STEP);
    }
    resolvers.get(index)!(index > lastIndex ? [] : createPage(index));
    await flushMicrotasks();
  }
  return { fetch, requested, settle };
}

function createFetcher(
  delivered: Post[][],
  fetch: (index: number) => Promise<Post[]>,
  delayForRetry: (retryCount: number) => number
): Rule34AllFavoritesFetcher {
  return new Rule34AllFavoritesFetcher({
    onPostsFound: (posts): number => delivered.push(posts),
    fetch,
    shouldRetry: () => true,
    delayForRetry,
    scheduler
  });
}

function createCappedFetcher(
  delivered: Post[][],
  fetch: (index: number) => Promise<Post[]>,
  shouldRetry: (error: unknown, failureCount: number) => boolean
): Rule34AllFavoritesFetcher {
  return new Rule34AllFavoritesFetcher({
    onPostsFound: (posts): number => delivered.push(posts),
    fetch,
    shouldRetry,
    delayForRetry: NO_DELAY,
    scheduler
  });
}

describe("Rule34AllFavoritesFetcher", () => {
  test("delivers pages in index order when they complete in order", async() => {
    const delivered: Post[][] = [];
    const pages = createDeferredFetcher(2);
    const run = createFetcher(delivered, pages.fetch, NO_DELAY).fetchAll();

    await flushMicrotasks();
    await pages.settle(0);
    await pages.settle(1);
    await pages.settle(2);
    await pages.settle(3);
    await runToEnd(run);

    expect(flattenPostIds(delivered)).toEqual(["page0", "page1", "page2"]);
  });

  test("delivers in index order even when a later page completes first", async() => {
    const delivered: Post[][] = [];
    const pages = createDeferredFetcher(2);
    const run = createFetcher(delivered, pages.fetch, NO_DELAY).fetchAll();

    await flushMicrotasks();
    await pages.settle(2);
    expect(delivered).toHaveLength(0);

    await pages.settle(1);
    expect(delivered).toHaveLength(0);

    await pages.settle(0);
    expect(flattenPostIds(delivered)).toEqual(["page0", "page1", "page2"]);

    await pages.settle(3);
    await runToEnd(run);
  });

  test("delivers the provided first page immediately and begins fetching at index 1", async() => {
    const delivered: Post[][] = [];
    const pages = createDeferredFetcher(2);
    const first = [createPost({ id: "first" })];
    const run = createFetcher(delivered, pages.fetch, NO_DELAY).fetchAll(first);

    await flushMicrotasks();
    expect(delivered).toEqual([first]);
    expect(pages.requested).not.toContain(0);

    await pages.settle(1);
    await pages.settle(2);
    await pages.settle(3);
    await runToEnd(run);

    expect(flattenPostIds(delivered)).toEqual(["first", "page1", "page2"]);
  });

  test("retries a failed page and still delivers it in order", async() => {
    const delivered: Post[][] = [];
    const fetch = vi.fn()
      .mockImplementationOnce(() => Promise.reject(new Error("boom")))
      .mockImplementation((index: number) => Promise.resolve(index > 1 ? [] : createPage(index)));

    await runToEnd(createFetcher(delivered, fetch, NO_DELAY).fetchAll());

    expect(flattenPostIds(delivered)).toEqual(["page0", "page1"]);
    const page0Attempts = fetch.mock.calls.filter(([index]) => index === 0).length;

    expect(page0Attempts).toBe(2);
  });

  test("stops fetching once an empty page is reached", async() => {
    const delivered: Post[][] = [];
    const fetch = vi.fn((index: number) => Promise.resolve(index >= 2 ? [] : createPage(index)));

    await runToEnd(createFetcher(delivered, fetch, NO_DELAY).fetchAll());
    expect(flattenPostIds(delivered)).toEqual(["page0", "page1"]);
  });

  test("waits for in-flight pages after the last page is found before finishing", async() => {
    const delivered: Post[][] = [];
    const pages = createDeferredFetcher(0);
    let hasFinished = false;
    const run = createFetcher(delivered, pages.fetch, NO_DELAY).fetchAll()
      .then(() => {
        hasFinished = true;
      });

    await flushMicrotasks();
    await pages.settle(1);
    await advanceAndSettle(scheduler, POLL_STEP);
    expect(hasFinished).toBe(false);

    await pages.settle(0);

    for (const index of pages.requested.filter(i => i > 1)) {
      await pages.settle(index);
    }
    await runToEnd(run);

    expect(flattenPostIds(delivered)).toEqual(["page0"]);
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

    await runToEnd(createFetcher(delivered, fetch, delayForRetry).fetchAll());
    expect(seenRetryCounts).toContain(1);
  });

  test("stops requesting pages and rejects once a failure shouldn't be retried", async() => {
    const delivered: Post[][] = [];
    const refused = new Error("refused");
    const fetch = vi.fn((index: number) => (index === 1 ? Promise.reject(refused) : Promise.resolve(createPage(index))));
    const run = createCappedFetcher(delivered, fetch, () => false).fetchAll();

    await expect(runToEnd(run)).rejects.toBe(refused);
    const requestedAfterRefusal = fetch.mock.calls.filter(([index]) => index > 2);

    expect(requestedAfterRefusal).toEqual([]);
    expect(fetch.mock.calls.filter(([index]) => index === 1)).toHaveLength(1);
  });

  test("waits for in-flight pages before rejecting", async() => {
    const refused = new Error("refused");
    let finishPage0: ResolvePosts = () => { };
    const fetch = vi.fn((index: number) => (index === 0 ? new Promise<Post[]>(resolve => {
      finishPage0 = resolve;
    }) : Promise.reject(refused)));
    let hasSettled = false;
    const run = createCappedFetcher([], fetch, () => false).fetchAll().catch((error: unknown) => {
      hasSettled = true;
      throw error;
    });

    await advanceAndSettle(scheduler, REQUEST_STEP);
    expect(fetch).toHaveBeenCalledTimes(2);
    await advanceAndSettle(scheduler, POLL_STEP);
    expect(hasSettled).toBe(false);

    finishPage0(createPage(0));
    await expect(runToEnd(run)).rejects.toBe(refused);
  });

  test("passes the failure count so retries can be capped", async() => {
    const delivered: Post[][] = [];
    const seenFailureCounts: number[] = [];
    const fetch = vi.fn((index: number) => (index === 0 ? Promise.reject(new Error("boom")) : Promise.resolve([])));
    const shouldRetry = (_error: unknown, failureCount: number): boolean => {
      seenFailureCounts.push(failureCount);
      return failureCount < 3;
    };

    await expect(runToEnd(createCappedFetcher(delivered, fetch, shouldRetry).fetchAll())).rejects.toThrow("boom");
    expect(seenFailureCounts).toEqual([1, 2, 3]);
  });
});
