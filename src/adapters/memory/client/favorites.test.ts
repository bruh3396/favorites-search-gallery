import { describe, expect, test } from "vitest";
import { MemoryFavorites } from "@/adapters/memory/client/favorites";
import { createPost } from "@/testing/post";

describe("MemoryFavorites", () => {
  test("holds its posts in order until one is removed", () => {
    const favorites = new MemoryFavorites(["3", "1", "2"].map(id => createPost({ id })));

    favorites.remove("1");
    expect(favorites.all().map(post => post.id)).toEqual(["3", "2"]);
  });
});
