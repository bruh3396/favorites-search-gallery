import { describe, expect, test } from "vitest";
import { MemoryPostSource } from "@/adapters/memory/post_source/post_source";
import { createPost } from "@/testing/post";

describe("MemoryPostSource", () => {
  test("delivers a post it holds", async() => {
    const fetched = await new MemoryPostSource([createPost({ id: "1", tags: "apple" })]).fetch("1");

    expect(fetched.post.tags).toBe("apple");
  });

  test("rejects for a post it doesn't hold", async() => {
    await expect(new MemoryPostSource([]).fetch("2")).rejects.toThrow();
  });
});
