import { describe, expect, test } from "vitest";
import { FilesystemFavoritesSource } from "@/adapters/filesystem/ports/favorites_source/favorites_source";
import { Post } from "@/core/domain/post/post";
import { PostFile } from "@/adapters/filesystem/client/client";
import { createPost } from "@/testing/post";

function createSource(...files: [id: string, modifiedAt: number][]): FilesystemFavoritesSource {
  const postFiles: PostFile[] = files.map(([id, modifiedAt]) => ({ post: createPost({ id }), modifiedAt }));
  return new FilesystemFavoritesSource({
    readPostFiles: () => Promise.resolve([...postFiles]),
    countPostFiles: () => Promise.resolve(postFiles.length)
  });
}

async function missingIdsFor(source: FilesystemFavoritesSource, knownIds: ReadonlySet<string>): Promise<string[]> {
  const delivered: Post[] = [];

  await source.fetchMissing(knownIds, posts => delivered.push(...posts));
  return delivered.map(post => post.id);
}

describe("FilesystemFavoritesSource", () => {
  test("delivers every post, newest first, when nothing is known", async() => {
    expect(await missingIdsFor(createSource(["old", 1], ["new", 3], ["middle", 2]), new Set())).toEqual(["new", "middle", "old"]);
  });

  test("counts the post files", async() => {
    expect(await createSource(["1", 1], ["2", 2]).fetchCount()).toBe(2);
  });

  test("delivers only posts not already known, newest first", async() => {
    expect(await missingIdsFor(createSource(["1", 1], ["2", 2], ["3", 3]), new Set(["2"]))).toEqual(["3", "1"]);
  });
});
