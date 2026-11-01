import { describe, expect, test, vi } from "vitest";
import { CategorizedPost } from "@/core/domain/post/categorized_post";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/memory_random_source";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/memory_scheduler";
import { Rule34Error } from "@/adapters/rule34/client/rule34_error";
import { Rule34RemotePages } from "@/adapters/rule34/ports/remote_pages/rule34_remote_pages";
import { createPost } from "@/testing/post";

type FetchPostPage = (postId: string) => Promise<CategorizedPost>;

function createRemotePages(fetchPostPage: FetchPostPage = () => Promise.resolve({
  post: createPost({ id: "7" }),
  tagCategories: new Map()
})): Rule34RemotePages {
  return new Rule34RemotePages({
    rule34Client: {
      postPageUrl: (postId: string): string => `post:${postId}`,
      postListUrl: (query: string): string => `list:${query}`,
      fetchPostPage
    },
    scheduler: new MemoryScheduler(),
    randomSource: new MemoryRandomSource()
  });
}

describe("Rule34RemotePages", () => {
  test("gives a post's URL as its post page", () => {
    expect(createRemotePages().postUrl("7")).toBe("post:7");
  });

  test("gives a search's URL as a post list", () => {
    expect(createRemotePages().searchUrl("apple banana")).toBe("list:apple banana");
  });

  test("says a post exists when its post page loads", async() => {
    const fetchPostPage = vi.fn<FetchPostPage>(() => Promise.resolve({ post: createPost({ id: "7", status: "deleted" }), tagCategories: new Map() }));

    expect(await createRemotePages(fetchPostPage).postExists("7")).toBe(true);
    expect(fetchPostPage).toHaveBeenCalledWith("7");
  });

  test("says a post doesn't exist when its post page is missing", async() => {
    expect(await createRemotePages(() => Promise.reject(new Rule34Error("http", { status: 404 }))).postExists("7")).toBe(false);
  });

  test("rejects when the post page can't be read", async() => {
    await expect(createRemotePages(() => Promise.reject(new Rule34Error("malformed"))).postExists("7")).rejects.toMatchObject({ reason: "malformed" });
  });
});
