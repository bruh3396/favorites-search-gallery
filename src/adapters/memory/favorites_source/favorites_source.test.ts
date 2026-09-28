import { describe, expect, test, vi } from "vitest";
import { MemoryClient } from "@/adapters/memory/client/client";
import { MemoryFavoritesSource } from "@/adapters/memory/favorites_source/favorites_source";
import { createPost } from "@/testing/post";

function createSource(...ids: string[]): MemoryFavoritesSource {
  return new MemoryFavoritesSource(new MemoryClient(ids.map(id => createPost({ id }))));
}

describe("MemoryFavoritesSource", () => {
  test("delivers every post in its order", async() => {
    const onFavoritesFound = vi.fn();

    await createSource("3", "1", "2").fetchAll(onFavoritesFound);
    expect(onFavoritesFound.mock.calls.flatMap(([posts]) => posts).map(post => post.id)).toEqual(["3", "1", "2"]);
  });

  test("counts every post", async() => {
    expect(await createSource("3", "1", "2").count()).toBe(3);
  });

  test("fetches only posts whose ids are not known", async() => {
    const posts = await createSource("3", "1", "2").fetchNew(new Set(["1"]));

    expect(posts.map(post => post.id)).toEqual(["3", "2"]);
  });
});
