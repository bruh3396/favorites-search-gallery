import { Mock, describe, expect, test, vi } from "vitest";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/memory_random_source";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/memory_scheduler";
import { Post } from "@/core/domain/post/post";
import { Rule34Error } from "@/adapters/rule34/client/rule34_error";
import { Rule34RemotePostList } from "@/adapters/rule34/ports/remote_post_list/rule34_remote_post_list";
import { PostListPage } from "@/core/domain/post_list/post_list_page";
import { advanceAndSettle } from "@/testing/async";
import { createPost } from "@/testing/post";

type FetchPostListPage = Mock<(searchQuery: string, pageIndex: number) => Promise<Post[]>>;

interface Setup {
  postList: Rule34RemotePostList;
  scheduler: MemoryScheduler;
  readPostListPage: Mock<(pageIndex: number) => Post[]>;
  fetchPostListPage: FetchPostListPage;
}

const LANDING_PAGE = [createPost({ id: "1" })];
const OTHER_PAGE = [createPost({ id: "2" })];

function setup(fetchPostListPage: FetchPostListPage = vi.fn(() => Promise.resolve(OTHER_PAGE)), initialPage: Post[] = LANDING_PAGE): Setup {
  const scheduler = new MemoryScheduler();
  const readPostListPage = vi.fn((): Post[] => initialPage);
  const rule34 = { readPostListPage, fetchPostListPage };
  const rule34Document = { readSearchQuery: (): string => "apple banana", readPostListPageIndex: (): number => 2 };
  const postList = new Rule34RemotePostList({ rule34, rule34Document, scheduler, randomSource: new MemoryRandomSource([1]) });
  return { postList, scheduler, readPostListPage, fetchPostListPage };
}

async function fetchFirstPage(fetchPostListPage: FetchPostListPage): Promise<PostListPage> {
  const { postList, scheduler } = setup(fetchPostListPage);
  const fetched = postList.fetchPage(0);

  fetched.catch(() => { });
  await advanceAndSettle(scheduler, 10_000);
  return fetched;
}

describe("Rule34RemotePostList", () => {
  test("reads the page the browser opened", () => {
    const { postList } = setup();

    expect(postList.readInitialPage()).toEqual({ index: 2, posts: LANDING_PAGE });
  });

  test("captures the native page when constructed and reuses it", async() => {
    const { postList, readPostListPage, fetchPostListPage } = setup();

    expect(readPostListPage).toHaveBeenCalledExactlyOnceWith(2);
    expect(await postList.fetchPage(2)).toBe(postList.readInitialPage());
    expect(await postList.fetchPage(2)).toBe(postList.readInitialPage());
    expect(readPostListPage).toHaveBeenCalledOnce();
    expect(fetchPostListPage).not.toHaveBeenCalled();
  });

  test("keeps an empty native page as the initial page", async() => {
    const { postList, readPostListPage, fetchPostListPage } = setup(undefined, []);

    expect(postList.readInitialPage()).toEqual({ index: 2, posts: [] });
    expect(await postList.fetchPage(2)).toBe(postList.readInitialPage());
    expect(readPostListPage).toHaveBeenCalledOnce();
    expect(fetchPostListPage).not.toHaveBeenCalled();
  });

  test("fetches any other page of the same search", async() => {
    const { postList, fetchPostListPage } = setup();

    expect(await postList.fetchPage(5)).toEqual({ index: 5, posts: OTHER_PAGE });
    expect(fetchPostListPage).toHaveBeenCalledWith("apple banana", 5);
  });

  test("retries a transient failure", async() => {
    const fetchPostListPage: FetchPostListPage = vi.fn<(searchQuery: string, pageIndex: number) => Promise<Post[]>>()
      .mockRejectedValueOnce(new Rule34Error("http", { status: 429 }))
      .mockResolvedValue(OTHER_PAGE);

    expect(await fetchFirstPage(fetchPostListPage)).toEqual({ index: 0, posts: OTHER_PAGE });
    expect(fetchPostListPage).toHaveBeenCalledTimes(2);
  });

  test("never retries a page it can't read", async() => {
    const fetchPostListPage: FetchPostListPage = vi.fn(() => Promise.reject(new Rule34Error("malformed")));

    await expect(fetchFirstPage(fetchPostListPage)).rejects.toThrow(Rule34Error);
    expect(fetchPostListPage).toHaveBeenCalledOnce();
  });
});
