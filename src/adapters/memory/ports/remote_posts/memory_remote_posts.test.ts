import { describe, expect, test } from "vitest";
import { MemoryClient } from "@/adapters/memory/client/memory_client";
import { MemoryRemotePosts } from "@/adapters/memory/ports/remote_posts/memory_remote_posts";
import { createPost } from "@/testing/post";

describe("MemoryRemotePosts", () => {
  test("delivers a post it holds", async() => {
    const fetchedCategorizedPost = await new MemoryRemotePosts(new MemoryClient([createPost({ id: "1", tags: "apple" })])).fetch({ id: "1" });

    expect(fetchedCategorizedPost.post.tags).toBe("apple");
  });

  test("rejects for a post it doesn't hold", async() => {
    await expect(new MemoryRemotePosts(new MemoryClient([])).fetch({ id: "2" })).rejects.toThrow();
  });
});
