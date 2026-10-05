import { Mock, describe, expect, test, vi } from "vitest";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/random_source";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { Post } from "@/core/domain/post/post";
import { Rule34Error } from "@/adapters/rule34/client/error";
import { Rule34RemoteSearchResults } from "@/adapters/rule34/ports/remote_search_results/remote_search_results";
import { advanceAndSettle } from "@/testing/async";
import { createPost } from "@/testing/post";

type FetchPostListPage = Mock<(searchQuery: string, pageIndex: number) => Promise<Post[]>>;

interface Setup {
  searchResults: Rule34RemoteSearchResults;
  scheduler: MemoryScheduler;
  readPostListPage: Mock<(pageIndex: number) => Post[]>;
  fetchPostListPage: FetchPostListPage;
}

const LANDING_PAGE = [createPost({ id: "1" })];
const OTHER_PAGE = [createPost({ id: "2" })];

function setup(fetchPostListPage: FetchPostListPage = vi.fn(() => Promise.resolve(OTHER_PAGE))): Setup {
  const scheduler = new MemoryScheduler();
  const readPostListPage = vi.fn((): Post[] => LANDING_PAGE);
  const rule34 = { readPostListPage, fetchPostListPage };
  const rule34Document = { readSearchQuery: (): string => "apple banana", readPostListPageIndex: (): number => 2 };
  const searchResults = new Rule34RemoteSearchResults({ rule34, rule34Document, scheduler, randomSource: new MemoryRandomSource([1]) });
  return { searchResults, scheduler, readPostListPage, fetchPostListPage };
}

async function fetchFirstPage(fetchPostListPage: FetchPostListPage): Promise<Post[]> {
  const { searchResults, scheduler } = setup(fetchPostListPage);
  const fetched = searchResults.fetchPage(0);

  fetched.catch(() => { });
  await advanceAndSettle(scheduler, 10_000);
  return fetched;
}

describe("Rule34RemoteSearchResults", () => {
  test("pages through the site's fixed page size, starting at the page the browser opened", () => {
    const { searchResults } = setup();

    expect(searchResults.pageSize).toBe(42);
    expect(searchResults.initialPageIndex).toBe(2);
  });

  test("reads the page the browser opened from the page itself, once", async() => {
    const { searchResults, readPostListPage, fetchPostListPage } = setup();

    expect(await searchResults.fetchPage(2)).toBe(LANDING_PAGE);
    expect(await searchResults.fetchPage(2)).toBe(LANDING_PAGE);
    expect(readPostListPage).toHaveBeenCalledOnce();
    expect(fetchPostListPage).not.toHaveBeenCalled();
  });

  test("fetches any other page of the same search", async() => {
    const { searchResults, fetchPostListPage } = setup();

    expect(await searchResults.fetchPage(5)).toBe(OTHER_PAGE);
    expect(fetchPostListPage).toHaveBeenCalledWith("apple banana", 5);
  });

  test("retries a transient failure", async() => {
    const fetchPostListPage: FetchPostListPage = vi.fn<(searchQuery: string, pageIndex: number) => Promise<Post[]>>()
      .mockRejectedValueOnce(new Rule34Error("http", { status: 429 }))
      .mockResolvedValue(OTHER_PAGE);

    expect(await fetchFirstPage(fetchPostListPage)).toBe(OTHER_PAGE);
    expect(fetchPostListPage).toHaveBeenCalledTimes(2);
  });

  test("never retries a page it can't read", async() => {
    const fetchPostListPage: FetchPostListPage = vi.fn(() => Promise.reject(new Rule34Error("malformed")));

    await expect(fetchFirstPage(fetchPostListPage)).rejects.toThrow(Rule34Error);
    expect(fetchPostListPage).toHaveBeenCalledOnce();
  });
});
