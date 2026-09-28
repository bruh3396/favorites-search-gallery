import { describe, expect, test } from "vitest";
import { MemoryClient } from "@/adapters/memory/client/client";
import { MemoryFavoritesEditor } from "@/adapters/memory/ports/favorites_editor/favorites_editor";
import { createPost } from "@/testing/post";

describe("MemoryFavoritesEditor", () => {
  test("removes a favorite from the list", async() => {
    const memory = new MemoryClient(["3", "1", "2"].map(id => createPost({ id })));

    await new MemoryFavoritesEditor(memory).remove("1");
    expect(memory.readFavorites().map(post => post.id)).toEqual(["3", "2"]);
  });

  test("adding succeeds and leaves the list as it is", async() => {
    const memory = new MemoryClient([createPost({ id: "1" })]);

    expect(await new MemoryFavoritesEditor(memory).add()).toBe("added");
    expect(memory.readFavorites().map(post => post.id)).toEqual(["1"]);
  });
});
