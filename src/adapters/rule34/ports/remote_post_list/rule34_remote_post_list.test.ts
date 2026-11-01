import { Mock, describe, expect, test, vi } from "vitest";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/memory_random_source";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/memory_scheduler";
import { Post } from "@/core/domain/post/post";
import { PostListPage } from "@/core/domain/post_list/post_list_page";
import { Rule34Error } from "@/adapters/rule34/client/rule34_error";
import { Rule34RemotePostList } from "@/adapters/rule34/ports/remote_post_list/rule34_remote_post_list";
import { advanceAndSettle } from "@/testing/microtask_utilities";
import { createPost } from "@/testing/post";

type FetchPostListPage = Mock<(searchQuery: string, pageIndex: number) => Promise<Post[]>>;

interface Setup {
  remotePostList: Rule34RemotePostList;
  scheduler: MemoryScheduler;
  readPostListPage: Mock<(pageIndex: number) => Post[]>;
  fetchPostListPage: FetchPostListPage;
}

const LANDING_PAGE = [createPost({ id: "1" })];
const OTHER_PAGE = [createPost({ id: "2" })];

function setup(fetchPostListPage: FetchPostListPage = vi.fn(() => Promise.resolve(OTHER_PAGE)), initialPagePosts: Post[] = LANDING_PAGE): Setup {
  const scheduler = new MemoryScheduler();
  const readPostListPage = vi.fn((): Post[] => initialPagePosts);
  const rule34Client = { readPostListPage, fetchPostListPage };
  const rule34Document = { readSearchQuery: (): string => "apple banana", readPostListPageIndex: (): number => 2 };
  const remotePostList = new Rule34RemotePostList({ rule34Client, rule34Document, scheduler, randomSource: new MemoryRandomSource([1]) });
  return { remotePostList, scheduler, readPostListPage, fetchPostListPage };
}

async function fetchFirstPage(fetchPostListPage: FetchPostListPage): Promise<PostListPage> {
  const { remotePostList, scheduler } = setup(fetchPostListPage);
  const fetched = remotePostList.fetchPage(0);

  fetched.catch(() => { });
  await advanceAndSettle(scheduler, 10_000);
  return fetched;
}

describe("Rule34RemotePostList", () => {
  test("reads the page the browser opened", () => {
    const { remotePostList } = setup();

    expect(remotePostList.readInitialPage()).toEqual({ index: 2, posts: LANDING_PAGE });
  });

  test("captures the native page when constructed and reuses it", async() => {
    const { remotePostList, readPostListPage, fetchPostListPage } = setup();

    expect(readPostListPage).toHaveBeenCalledExactlyOnceWith(2);
    expect(await remotePostList.fetchPage(2)).toBe(remotePostList.readInitialPage());
    expect(await remotePostList.fetchPage(2)).toBe(remotePostList.readInitialPage());
    expect(readPostListPage).toHaveBeenCalledOnce();
    expect(fetchPostListPage).not.toHaveBeenCalled();
  });

  test("keeps an empty native page as the initial page", async() => {
    const { remotePostList, readPostListPage, fetchPostListPage } = setup(undefined, []);

    expect(remotePostList.readInitialPage()).toEqual({ index: 2, posts: [] });
    expect(await remotePostList.fetchPage(2)).toBe(remotePostList.readInitialPage());
    expect(readPostListPage).toHaveBeenCalledOnce();
    expect(fetchPostListPage).not.toHaveBeenCalled();
  });

  test("fetches any other page of the same search", async() => {
    const { remotePostList, fetchPostListPage } = setup();

    expect(await remotePostList.fetchPage(5)).toEqual({ index: 5, posts: OTHER_PAGE });
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
