import { describe, expect, test } from "vitest";
import { MemoryClient } from "@/adapters/memory/client/memory_client";
import { createPost } from "@/testing/post";

describe("MemoryClient", () => {
  test("holds its favorites in order until one is removed", () => {
    const memoryClient = new MemoryClient(["3", "1", "2"].map(id => createPost({ id })));

    memoryClient.removeFavorite("1");
    expect(memoryClient.readFavorites().map(post => post.id)).toEqual(["3", "2"]);
  });

  test("adds back a known post only once, and never an unknown one", () => {
    const memoryClient = new MemoryClient(["1", "2"].map(id => createPost({ id })));

    memoryClient.removeFavorite("2");
    memoryClient.addFavorite("2");
    memoryClient.addFavorite("2");
    memoryClient.addFavorite("3");
    expect(memoryClient.readFavorites().map(post => post.id)).toEqual(["2", "1"]);
  });

  test("keeps a post that stopped being a favorite", () => {
    const memoryClient = new MemoryClient([createPost({ id: "1", tags: "apple" })]);

    memoryClient.removeFavorite("1");
    expect(memoryClient.readPost("1")?.tags).toBe("apple");
    expect(memoryClient.readPost("2")).toBeUndefined();
  });

  test("reads every post it holds, favorite or not, in order", () => {
    const memoryClient = new MemoryClient(["2", "1"].map(id => createPost({ id })));

    memoryClient.removeFavorite("2");
    expect(memoryClient.readPosts().map(post => post.id)).toEqual(["2", "1"]);
  });
});
