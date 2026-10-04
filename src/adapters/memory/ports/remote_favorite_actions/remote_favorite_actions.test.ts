import { describe, expect, test } from "vitest";
import { MemoryClient } from "@/adapters/memory/client/client";
import { MemoryRemoteFavoriteActions } from "@/adapters/memory/ports/remote_favorite_actions/remote_favorite_actions";
import { createPost } from "@/testing/post";

function createMemory(...ids: string[]): MemoryClient {
  return new MemoryClient(ids.map(id => createPost({ id })));
}

describe("MemoryRemoteFavoriteActions", () => {
  test("removes a favorite from the list", async() => {
    const memory = createMemory("3", "1", "2");

    expect(await new MemoryRemoteFavoriteActions(memory).remove("1")).toBe("removed");
    expect(memory.readFavorites().map(post => post.id)).toEqual(["3", "2"]);
  });

  test("adds a favorite to the front of the list", async() => {
    const memory = createMemory("3", "1", "2");

    memory.removeFavorite("1");
    expect(await new MemoryRemoteFavoriteActions(memory).add("1")).toBe("added");
    expect(memory.readFavorites().map(post => post.id)).toEqual(["1", "3", "2"]);
  });
});
