import { describe, expect, test } from "vitest";
import { MemoryClient } from "@/adapters/memory/client/client";
import { MemoryFavoritesSource } from "@/adapters/memory/ports/favorites_source/favorites_source";
import { Post } from "@/core/domain/post/post";
import { createPost } from "@/testing/post";

function createSource(...ids: string[]): MemoryFavoritesSource {
  return new MemoryFavoritesSource(new MemoryClient(ids.map(id => createPost({ id }))));
}

async function missingIdsFor(source: MemoryFavoritesSource, knownIds: ReadonlySet<string>): Promise<string[]> {
  const delivered: Post[] = [];

  await source.fetchMissing(knownIds, posts => delivered.push(...posts));
  return delivered.map(post => post.id);
}

describe("MemoryFavoritesSource", () => {
  test("delivers every post in its order when nothing is known", async() => {
    expect(await missingIdsFor(createSource("3", "1", "2"), new Set())).toEqual(["3", "1", "2"]);
  });

  test("counts every post", async() => {
    expect(await createSource("3", "1", "2").fetchCount()).toBe(3);
  });

  test("delivers only posts whose ids are not known", async() => {
    expect(await missingIdsFor(createSource("3", "1", "2"), new Set(["1"]))).toEqual(["3", "2"]);
  });
});
