import { describe, expect, test } from "vitest";
import { MemoryFavorites } from "@/adapters/memory/client/favorites";
import { MemoryFavoritesEditor } from "@/adapters/memory/favorites_editor/favorites_editor";
import { createPost } from "@/testing/post";

describe("MemoryFavoritesEditor", () => {
  test("removes a favorite from the list", async() => {
    const favorites = new MemoryFavorites(["3", "1", "2"].map(id => createPost({ id })));

    await new MemoryFavoritesEditor(favorites).remove("1");
    expect(favorites.all().map(post => post.id)).toEqual(["3", "2"]);
  });

  test("adding succeeds and leaves the list as it is", async() => {
    const favorites = new MemoryFavorites([createPost({ id: "1" })]);

    expect(await new MemoryFavoritesEditor(favorites).add()).toBe("success");
    expect(favorites.all().map(post => post.id)).toEqual(["1"]);
  });
});
