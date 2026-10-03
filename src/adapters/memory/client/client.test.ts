import { describe, expect, test } from "vitest";
import { MemoryClient } from "@/adapters/memory/client/client";
import { createPost } from "@/testing/post";

describe("MemoryClient", () => {
  test("holds its favorites in order until one is removed", () => {
    const client = new MemoryClient(["3", "1", "2"].map(id => createPost({ id })));

    client.removeFavorite("1");
    expect(client.readFavorites().map(post => post.id)).toEqual(["3", "2"]);
  });

  test("adds back a known post only once, and never an unknown one", () => {
    const client = new MemoryClient(["1", "2"].map(id => createPost({ id })));

    client.removeFavorite("2");
    client.addFavorite("2");
    client.addFavorite("2");
    client.addFavorite("3");
    expect(client.readFavorites().map(post => post.id)).toEqual(["2", "1"]);
  });

  test("keeps a post that stopped being a favorite", () => {
    const client = new MemoryClient([createPost({ id: "1", tags: "apple" })]);

    client.removeFavorite("1");
    expect(client.readPost("1")?.tags).toBe("apple");
    expect(client.readPost("2")).toBeUndefined();
  });

  test("reads every post it holds, favorite or not, in order", () => {
    const client = new MemoryClient(["2", "1"].map(id => createPost({ id })));

    client.removeFavorite("2");
    expect(client.readPosts().map(post => post.id)).toEqual(["2", "1"]);
  });
});
