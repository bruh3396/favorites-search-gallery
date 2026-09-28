import { describe, expect, test } from "vitest";
import { PostList } from "@/features/post_list_navigator/types/post_list_page";
import { PostListNavigatorPageCache } from "@/features/post_list_navigator/model/page_cache";
import { createPosts } from "@/testing/post";

function createPostList(pageIndex: number, ...ids: string[]): PostList {
  return new PostList(pageIndex, [], createPosts(...ids), null);
}

const idsOf = (posts: { id: string }[]): string[] => posts.map(post => post.id);

describe("PostListNavigatorPageCache", () => {
  test("lists the posts of every loaded page in page order", () => {
    const cache = new PostListNavigatorPageCache();

    cache.markLoaded(2, createPostList(2, "3", "4"));
    cache.markLoaded(1, createPostList(1, "1", "2"));
    cache.markLoading(3, Promise.resolve());
    expect(idsOf(cache.allPosts())).toEqual(["1", "2", "3", "4"]);
  });

  test("finds a loaded post by id", () => {
    const cache = new PostListNavigatorPageCache();

    cache.markLoaded(1, createPostList(1, "1", "2"));
    expect(cache.getPost("2")?.id).toBe("2");
    expect(cache.getPost("3")).toBeUndefined();
  });

  test("forgets a removed page's posts", () => {
    const cache = new PostListNavigatorPageCache();

    cache.markLoaded(1, createPostList(1, "1"));
    cache.remove(1);
    expect(cache.getPost("1")).toBeUndefined();
    expect(cache.allPosts()).toEqual([]);
  });

  test("replaces a reloaded page's posts", () => {
    const cache = new PostListNavigatorPageCache();

    cache.markLoaded(1, createPostList(1, "1"));
    cache.markLoaded(1, createPostList(1, "2"));
    expect(cache.getPost("1")).toBeUndefined();
    expect(idsOf(cache.allPosts())).toEqual(["2"]);
  });
});
