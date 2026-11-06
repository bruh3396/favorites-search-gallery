import { describe, expect, test, vi } from "vitest";
import { FilesystemPostFile } from "@/adapters/filesystem/client/filesystem_post_file";
import { FilesystemRemoteFavorites } from "@/adapters/filesystem/ports/remote_favorites/filesystem_remote_favorites";
import { Post } from "@/core/domain/post/post";
import { createPost } from "@/testing/post";

function createRemoteFavorites(...files: [id: string, modifiedAt: number][]): FilesystemRemoteFavorites {
  const filesystemPostFiles: FilesystemPostFile[] = files.map(([id, modifiedAt]) => ({ post: createPost({ id }), modifiedAt }));
  return new FilesystemRemoteFavorites({
    readPostFiles: () => Promise.resolve([...filesystemPostFiles]),
    countPostFiles: () => Promise.resolve(filesystemPostFiles.length),
    deletePostFile: () => Promise.resolve()
  });
}

async function fetchAllPostIds(remoteFavorites: FilesystemRemoteFavorites): Promise<string[]> {
  const deliveredPosts: Post[] = [];

  await remoteFavorites.fetchAll(posts => deliveredPosts.push(...posts));
  return deliveredPosts.map(post => post.id);
}

describe("FilesystemRemoteFavorites", () => {
  test("delivers every post, newest first", async() => {
    expect(await fetchAllPostIds(createRemoteFavorites(["old", 1], ["new", 3], ["middle", 2]))).toEqual(["new", "middle", "old"]);
  });

  test("counts the post files", async() => {
    expect(await createRemoteFavorites(["1", 1], ["2", 2]).fetchCount()).toBe(2);
  });

  test("finds the posts newer than the local favorites, newest first", async() => {
    const foundPosts = await createRemoteFavorites(["1", 1], ["2", 2], ["3", 3], ["4", 4]).findNew(["2", "1"]);

    expect(foundPosts.map(post => post.id)).toEqual(["4", "3"]);
  });

  test("finds the local ids that have no post file, in local order", async() => {
    expect(await createRemoteFavorites(["3", 3], ["1", 1]).findMissing(["4", "3", "2", "1"])).toEqual(["4", "2"]);
  });

  test("deletes the post's file on remove", async() => {
    const filesystem = {
      readPostFiles: (): Promise<FilesystemPostFile[]> => Promise.resolve([]),
      countPostFiles: (): Promise<number> => Promise.resolve(0),
      deletePostFile: vi.fn(() => Promise.resolve())
    };

    expect(await new FilesystemRemoteFavorites(filesystem).remove("1")).toBe(true);
    expect(filesystem.deletePostFile).toHaveBeenCalledWith("1");
  });

  test("succeeds on add", async() => {
    expect(await createRemoteFavorites().add()).toBe("added");
  });
});
