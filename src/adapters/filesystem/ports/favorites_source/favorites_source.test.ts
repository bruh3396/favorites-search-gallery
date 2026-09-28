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

function idsOf(posts: Post[]): string[] {
  return posts.map(post => post.id);
}

describe("FilesystemFavoritesSource", () => {
  test("delivers every post, newest first", async() => {
    const delivered: Post[] = [];

    await createSource(["old", 1], ["new", 3], ["middle", 2]).fetchAll(posts => delivered.push(...posts));
    expect(idsOf(delivered)).toEqual(["new", "middle", "old"]);
  });

  test("counts the post files", async() => {
    expect(await createSource(["1", 1], ["2", 2]).count()).toBe(2);
  });

  test("returns only posts not already known, newest first", async() => {
    expect(idsOf(await createSource(["1", 1], ["2", 2], ["3", 3]).fetchNew(new Set(["2"])))).toEqual(["3", "1"]);
  });
});
