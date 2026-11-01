import { describe, expect, test } from "vitest";
import { MemoryClient } from "@/adapters/memory/client/memory_client";
import { MemoryRemotePostList } from "@/adapters/memory/ports/remote_post_list/memory_remote_post_list";
import { createPost } from "@/testing/post";

function createPostList(): MemoryRemotePostList {
  const memoryClient = new MemoryClient(["1", "2", "3", "4", "5"].map(id => createPost({ id })));
  return new MemoryRemotePostList({ pageSize: 2, initialPageIndex: 1 }, memoryClient);
}

async function pageAt(index: number): Promise<{ index: number; postIds: string[] }> {
  const postListPage = await createPostList().fetchPage(index);
  return { index: postListPage.index, postIds: postListPage.posts.map(post => post.id) };
}

describe("MemoryRemotePostList", () => {
  test("reads the configured initial page", async() => {
    const remotePostList = createPostList();
    const postListPage = remotePostList.readInitialPage();

    expect(postListPage.index).toBe(1);
    expect(postListPage.posts.map(post => post.id)).toEqual(["3", "4"]);
    expect(remotePostList.readInitialPage()).toBe(postListPage);
    await expect(remotePostList.fetchPage(1)).resolves.toBe(postListPage);
  });

  test("serves each page of posts in order, with a short last page and empty pages past it", async() => {
    expect(await pageAt(0)).toEqual({ index: 0, postIds: ["1", "2"] });
    expect(await pageAt(2)).toEqual({ index: 2, postIds: ["5"] });
    expect(await pageAt(3)).toEqual({ index: 3, postIds: [] });
  });
});
