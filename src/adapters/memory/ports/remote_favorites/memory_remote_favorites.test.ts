import { describe, expect, test } from "vitest";
import { MemoryClient } from "@/adapters/memory/client/memory_client";
import { MemoryRemoteFavorites } from "@/adapters/memory/ports/remote_favorites/memory_remote_favorites";
import { Post } from "@/core/domain/post/post";
import { createPost } from "@/testing/post";

function createMemory(...ids: string[]): MemoryClient {
  return new MemoryClient(ids.map(id => createPost({ id })));
}

function createRemoteFavorites(...ids: string[]): MemoryRemoteFavorites {
  return new MemoryRemoteFavorites(createMemory(...ids));
}

async function fetchAllIds(source: MemoryRemoteFavorites): Promise<string[]> {
  const delivered: Post[] = [];

  await source.fetchAll(posts => delivered.push(...posts));
  return delivered.map(post => post.id);
}

async function findNewIds(source: MemoryRemoteFavorites, localIds: string[]): Promise<string[]> {
  return (await source.findNew(localIds)).map(post => post.id);
}

describe("MemoryRemoteFavorites", () => {
  test("delivers every post in its order", async() => {
    expect(await fetchAllIds(createRemoteFavorites("3", "1", "2"))).toEqual(["3", "1", "2"]);
  });

  test("counts every post", async() => {
    expect(await createRemoteFavorites("3", "1", "2").fetchCount()).toBe(3);
  });

  test("finds nothing new when it lists exactly the local favorites", async() => {
    expect(await findNewIds(createRemoteFavorites("a", "b", "c"), ["a", "b", "c"])).toEqual([]);
  });

  test("finds the favorites listed above the local favorites", async() => {
    expect(await findNewIds(createRemoteFavorites("x", "y", "a", "b"), ["a", "b"])).toEqual(["x", "y"]);
  });

  test("finds a re-favorited local favorite at the top as new", async() => {
    expect(await findNewIds(createRemoteFavorites("c", "a", "b", "d"), ["a", "b", "c", "d"])).toEqual(["c"]);
  });

  test("finds nothing new when only removals happened", async() => {
    expect(await findNewIds(createRemoteFavorites("b", "d"), ["a", "b", "c", "d"])).toEqual([]);
  });

  test("finds every favorite new when none are local", async() => {
    expect(await findNewIds(createRemoteFavorites("x", "y"), ["a", "b"])).toEqual(["x", "y"]);
  });

  test("finds the local ids it no longer lists, in local order", async() => {
    expect(await createRemoteFavorites("3", "1").findRemoved(["4", "3", "2", "1"])).toEqual(["4", "2"]);
  });

  test("removes a favorite from the list", async() => {
    const memory = createMemory("3", "1", "2");

    expect(await new MemoryRemoteFavorites(memory).remove("1")).toBe(true);
    expect(memory.readFavorites().map(post => post.id)).toEqual(["3", "2"]);
  });

  test("adds a favorite to the front of the list", async() => {
    const memory = createMemory("3", "1", "2");

    memory.removeFavorite("1");
    expect(await new MemoryRemoteFavorites(memory).add("1")).toBe(true);
    expect(memory.readFavorites().map(post => post.id)).toEqual(["1", "3", "2"]);
  });
});
