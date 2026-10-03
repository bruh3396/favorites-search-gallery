import { describe, expect, test, vi } from "vitest";
import { FilesystemRemoteFavorites } from "@/adapters/filesystem/ports/remote_favorites/remote_favorites";
import { Post } from "@/core/domain/post/post";
import { PostFile } from "@/adapters/filesystem/client/client";
import { createPost } from "@/testing/post";

function createRemoteFavorites(...files: [id: string, modifiedAt: number][]): FilesystemRemoteFavorites {
  const postFiles: PostFile[] = files.map(([id, modifiedAt]) => ({ post: createPost({ id }), modifiedAt }));
  return new FilesystemRemoteFavorites({
    readPostFiles: () => Promise.resolve([...postFiles]),
    countPostFiles: () => Promise.resolve(postFiles.length),
    deletePostFile: () => Promise.resolve()
  });
}

async function missingIdsFor(source: FilesystemRemoteFavorites, knownIds: ReadonlySet<string>): Promise<string[]> {
  const delivered: Post[] = [];

  await source.fetchAllExcept(knownIds, posts => delivered.push(...posts));
  return delivered.map(post => post.id);
}

describe("FilesystemRemoteFavorites", () => {
  test("delivers every post, newest first, when nothing is known", async() => {
    expect(await missingIdsFor(createRemoteFavorites(["old", 1], ["new", 3], ["middle", 2]), new Set())).toEqual(["new", "middle", "old"]);
  });

  test("counts the post files", async() => {
    expect(await createRemoteFavorites(["1", 1], ["2", 2]).fetchCount()).toBe(2);
  });

  test("delivers only posts not already known, newest first", async() => {
    expect(await missingIdsFor(createRemoteFavorites(["1", 1], ["2", 2], ["3", 3]), new Set(["2"]))).toEqual(["3", "1"]);
  });

  test("finds the stored ids that have no post file, in stored order", async() => {
    expect(await createRemoteFavorites(["3", 3], ["1", 1]).findRemoved(["4", "3", "2", "1"])).toEqual(["4", "2"]);
  });

  test("removing deletes the post's file", async() => {
    const filesystem = { readPostFiles: vi.fn(), countPostFiles: vi.fn(), deletePostFile: vi.fn(() => Promise.resolve()) };

    expect(await new FilesystemRemoteFavorites(filesystem).remove("1")).toBe("removed");
    expect(filesystem.deletePostFile).toHaveBeenCalledWith("1");
  });

  test("adding succeeds", async() => {
    expect(await createRemoteFavorites().add()).toBe("added");
  });
});
