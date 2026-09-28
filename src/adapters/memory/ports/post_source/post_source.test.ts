import { describe, expect, test } from "vitest";
import { MemoryClient } from "@/adapters/memory/client/client";
import { MemoryPostSource } from "@/adapters/memory/ports/post_source/post_source";
import { createPost } from "@/testing/post";

describe("MemoryPostSource", () => {
  test("delivers a post it holds", async() => {
    const fetched = await new MemoryPostSource(new MemoryClient([createPost({ id: "1", tags: "apple" })])).fetchPost("1");

    expect(fetched.post.tags).toBe("apple");
  });

  test("rejects for a post it doesn't hold", async() => {
    await expect(new MemoryPostSource(new MemoryClient([])).fetchPost("2")).rejects.toThrow();
  });
});
