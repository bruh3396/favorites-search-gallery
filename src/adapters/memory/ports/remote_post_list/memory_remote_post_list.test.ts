import { describe, expect, test } from "vitest";
import { MemoryClient } from "@/adapters/memory/client/memory_client";
import { MemoryRemotePostList } from "@/adapters/memory/ports/remote_post_list/memory_remote_post_list";
import { createPost } from "@/testing/post";

function createPostList(): MemoryRemotePostList {
  const memory = new MemoryClient(["1", "2", "3", "4", "5"].map(id => createPost({ id })));
  return new MemoryRemotePostList({ pageSize: 2, initialPageIndex: 1 }, memory);
}

async function pageAt(index: number): Promise<{ index: number; ids: string[] }> {
  const page = await createPostList().fetchPage(index);
  return { index: page.index, ids: page.posts.map(post => post.id) };
}

describe("MemoryRemotePostList", () => {
  test("reads the configured initial page", async() => {
    const postList = createPostList();
    const page = postList.readInitialPage();

    expect(page.index).toBe(1);
    expect(page.posts.map(post => post.id)).toEqual(["3", "4"]);
    expect(postList.readInitialPage()).toBe(page);
    await expect(postList.fetchPage(1)).resolves.toBe(page);
  });

  test("serves each page of posts in order, with a short last page and empty pages past it", async() => {
    expect(await pageAt(0)).toEqual({ index: 0, ids: ["1", "2"] });
    expect(await pageAt(2)).toEqual({ index: 2, ids: ["5"] });
    expect(await pageAt(3)).toEqual({ index: 3, ids: [] });
  });
});
