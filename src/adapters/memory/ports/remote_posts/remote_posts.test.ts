import { describe, expect, test } from "vitest";
import { MemoryClient } from "@/adapters/memory/client/client";
import { MemoryRemotePosts } from "@/adapters/memory/ports/remote_posts/remote_posts";
import { createPost } from "@/testing/post";

describe("MemoryRemotePosts", () => {
  test("delivers a post it holds", async() => {
    const fetched = await new MemoryRemotePosts(new MemoryClient([createPost({ id: "1", tags: "apple" })])).fetch("1");

    expect(fetched.post.tags).toBe("apple");
  });

  test("rejects for a post it doesn't hold", async() => {
    await expect(new MemoryRemotePosts(new MemoryClient([])).fetch("2")).rejects.toThrow();
  });
});
