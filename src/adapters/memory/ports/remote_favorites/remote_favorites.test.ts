import { describe, expect, test } from "vitest";
import { MemoryClient } from "@/adapters/memory/client/client";
import { MemoryRemoteFavorites } from "@/adapters/memory/ports/remote_favorites/remote_favorites";
import { Post } from "@/core/domain/post/post";
import { createPost } from "@/testing/post";

function createRemoteFavorites(...ids: string[]): MemoryRemoteFavorites {
  return new MemoryRemoteFavorites(new MemoryClient(ids.map(id => createPost({ id }))));
}

async function missingIdsFor(source: MemoryRemoteFavorites, knownIds: ReadonlySet<string>): Promise<string[]> {
  const delivered: Post[] = [];

  await source.fetchAllExcept(knownIds, posts => delivered.push(...posts));
  return delivered.map(post => post.id);
}

describe("MemoryRemoteFavorites", () => {
  test("delivers every post in its order when nothing is known", async() => {
    expect(await missingIdsFor(createRemoteFavorites("3", "1", "2"), new Set())).toEqual(["3", "1", "2"]);
  });

  test("counts every post", async() => {
    expect(await createRemoteFavorites("3", "1", "2").fetchCount()).toBe(3);
  });

  test("delivers only posts whose ids are not known", async() => {
    expect(await missingIdsFor(createRemoteFavorites("3", "1", "2"), new Set(["1"]))).toEqual(["3", "2"]);
  });

  test("removes a favorite from the list", async() => {
    const memory = new MemoryClient(["3", "1", "2"].map(id => createPost({ id })));

    await new MemoryRemoteFavorites(memory).remove("1");
    expect(memory.readFavorites().map(post => post.id)).toEqual(["3", "2"]);
  });

  test("adds a favorite to the front of the list", async() => {
    const memory = new MemoryClient(["3", "1", "2"].map(id => createPost({ id })));

    memory.removeFavorite("1");
    expect(await new MemoryRemoteFavorites(memory).add("1")).toBe("added");
    expect(memory.readFavorites().map(post => post.id)).toEqual(["1", "3", "2"]);
  });
});
