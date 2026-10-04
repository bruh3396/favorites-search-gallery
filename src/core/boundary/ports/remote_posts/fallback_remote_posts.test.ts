import { CategorizedPost, Post } from "@/core/domain/post/post";
import { Mock, describe, expect, test, vi } from "vitest";
import { FallbackRemotePosts } from "@/core/boundary/ports/remote_posts/fallback_remote_posts";
import { PostUnavailableError } from "@/core/boundary/ports/remote_posts/remote_posts";
import { createPost } from "@/testing/post";

type Fetch = Mock<(post: Pick<Post, "id" | "deleted">) => Promise<CategorizedPost>>;

function createFetch(width: number): Fetch {
  return vi.fn(({ id }: Pick<Post, "id">) => Promise.resolve({ post: createPost({ id, width }), tagCategories: new Map() }));
}

function setup(): { remotePosts: FallbackRemotePosts; primary: Fetch; fallback: Fetch } {
  const primary = createFetch(1);
  const fallback = createFetch(2);
  return { remotePosts: new FallbackRemotePosts({ primary: { fetch: primary }, fallback: { fetch: fallback } }), primary, fallback };
}

describe("FallbackRemotePosts", () => {
  test("delivers the primary's post", async() => {
    const { remotePosts, fallback } = setup();

    expect((await remotePosts.fetch({ id: "1" })).post.width).toBe(1);
    expect(fallback).not.toHaveBeenCalled();
  });

  test("asks the fallback for a post the primary doesn't have", async() => {
    const { remotePosts, primary, fallback } = setup();

    primary.mockRejectedValueOnce(new PostUnavailableError("1"));

    expect((await remotePosts.fetch({ id: "1", deleted: true })).post.width).toBe(2);
    expect(fallback).toHaveBeenCalledWith({ id: "1", deleted: true });
  });

  test("passes on any other failure without asking the fallback", async() => {
    const { remotePosts, primary, fallback } = setup();

    primary.mockRejectedValueOnce(new Error("down"));

    await expect(remotePosts.fetch({ id: "1" })).rejects.toThrow("down");
    expect(fallback).not.toHaveBeenCalled();
  });

  test("passes on the fallback's failure", async() => {
    const { remotePosts, primary, fallback } = setup();

    primary.mockRejectedValueOnce(new PostUnavailableError("1"));
    fallback.mockRejectedValueOnce(new Error("post page has no file"));

    await expect(remotePosts.fetch({ id: "1" })).rejects.toThrow("post page has no file");
  });
});
