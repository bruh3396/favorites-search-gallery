import { describe, expect, test } from "vitest";
import { FilesystemRemoteFavorites } from "@/adapters/filesystem/ports/remote_favorites/remote_favorites";
import { Post } from "@/core/domain/post/post";
import { PostFile } from "@/adapters/filesystem/client/client";
import { createPost } from "@/testing/post";

function createRemoteFavorites(...files: [id: string, modifiedAt: number][]): FilesystemRemoteFavorites {
  const postFiles: PostFile[] = files.map(([id, modifiedAt]) => ({ post: createPost({ id }), modifiedAt }));
  return new FilesystemRemoteFavorites({
    readPostFiles: () => Promise.resolve([...postFiles]),
    countPostFiles: () => Promise.resolve(postFiles.length)
  });
}

async function fetchAllIds(source: FilesystemRemoteFavorites): Promise<string[]> {
  const delivered: Post[] = [];

  await source.fetchAll(posts => delivered.push(...posts));
  return delivered.map(post => post.id);
}

describe("FilesystemRemoteFavorites", () => {
  test("delivers every post, newest first", async() => {
    expect(await fetchAllIds(createRemoteFavorites(["old", 1], ["new", 3], ["middle", 2]))).toEqual(["new", "middle", "old"]);
  });

  test("counts the post files", async() => {
    expect(await createRemoteFavorites(["1", 1], ["2", 2]).fetchCount()).toBe(2);
  });

  test("finds the posts newer than the local favorites, newest first", async() => {
    const found = await createRemoteFavorites(["1", 1], ["2", 2], ["3", 3], ["4", 4]).findNew(["2", "1"]);

    expect(found.map(post => post.id)).toEqual(["4", "3"]);
  });

  test("finds the local ids that have no post file, in local order", async() => {
    expect(await createRemoteFavorites(["3", 3], ["1", 1]).findRemoved(["4", "3", "2", "1"])).toEqual(["4", "2"]);
  });
});
