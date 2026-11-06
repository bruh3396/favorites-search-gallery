import { describe, expect, test } from "vitest";
import { MemoryClient } from "@/adapters/memory/client/memory_client";
import { MemoryRemoteFavorites } from "@/adapters/memory/ports/remote_favorites/memory_remote_favorites";
import { Post } from "@/core/domain/post/post";
import { createPost } from "@/testing/post";

function createMemory(...postIds: string[]): MemoryClient {
  return new MemoryClient(postIds.map(id => createPost({ id })));
}

function createRemoteFavorites(...postIds: string[]): MemoryRemoteFavorites {
  return new MemoryRemoteFavorites(createMemory(...postIds));
}

async function fetchAllPostIds(remoteFavorites: MemoryRemoteFavorites): Promise<string[]> {
  const deliveredPosts: Post[] = [];

  await remoteFavorites.fetchAll(posts => deliveredPosts.push(...posts));
  return deliveredPosts.map(post => post.id);
}

async function findNewPostIds(remoteFavorites: MemoryRemoteFavorites, localPostIds: string[]): Promise<string[]> {
  return (await remoteFavorites.findNew(localPostIds)).map(post => post.id);
}

describe("MemoryRemoteFavorites", () => {
  test("delivers every post in its order", async() => {
    expect(await fetchAllPostIds(createRemoteFavorites("3", "1", "2"))).toEqual(["3", "1", "2"]);
  });

  test("counts every post", async() => {
    expect(await createRemoteFavorites("3", "1", "2").fetchCount()).toBe(3);
  });

  test("finds nothing new when it lists exactly the local favorites", async() => {
    expect(await findNewPostIds(createRemoteFavorites("a", "b", "c"), ["a", "b", "c"])).toEqual([]);
  });

  test("finds the favorites listed above the local favorites", async() => {
    expect(await findNewPostIds(createRemoteFavorites("x", "y", "a", "b"), ["a", "b"])).toEqual(["x", "y"]);
  });

  test("finds a re-favorited local favorite at the top as new", async() => {
    expect(await findNewPostIds(createRemoteFavorites("c", "a", "b", "d"), ["a", "b", "c", "d"])).toEqual(["c"]);
  });

  test("finds nothing new when only removals happened", async() => {
    expect(await findNewPostIds(createRemoteFavorites("b", "d"), ["a", "b", "c", "d"])).toEqual([]);
  });

  test("finds every favorite new when none are local", async() => {
    expect(await findNewPostIds(createRemoteFavorites("x", "y"), ["a", "b"])).toEqual(["x", "y"]);
  });

  test("finds the local ids it no longer lists, in local order", async() => {
    expect(await createRemoteFavorites("3", "1").findMissing(["4", "3", "2", "1"])).toEqual(["4", "2"]);
  });

  test("removes a favorite from the list", async() => {
    const memoryClient = createMemory("3", "1", "2");

    expect(await new MemoryRemoteFavorites(memoryClient).remove("1")).toBe(true);
    expect(memoryClient.readFavorites().map(post => post.id)).toEqual(["3", "2"]);
  });

  test("adds a favorite to the front of the list", async() => {
    const memoryClient = createMemory("3", "1", "2");

    memoryClient.removeFavorite("1");
    expect(await new MemoryRemoteFavorites(memoryClient).add("1")).toBe("added");
    expect(memoryClient.readFavorites().map(post => post.id)).toEqual(["1", "3", "2"]);
  });
});
