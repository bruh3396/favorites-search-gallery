import { Post } from "@/core/domain/post/post";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { mkdtemp, rm, utimes, writeFile } from "node:fs/promises";
import { FileSystemFavoritesSource } from "@/adapters/filesystem/favorites_source/favorites_source";
import { createPost } from "@/testing/post";
import { join } from "node:path";
import { tmpdir } from "node:os";

let directory: string;

async function writePostFile(id: string, modifiedAtSeconds: number): Promise<void> {
  const path = join(directory, `${id}.json`);

  await writeFile(path, JSON.stringify(createPost({ id })));
  await utimes(path, modifiedAtSeconds, modifiedAtSeconds);
}

function idsOf(posts: Post[]): string[] {
  return posts.map(post => post.id);
}

describe("FileSystemFavoritesSource", () => {
  beforeEach(async() => {
    directory = await mkdtemp(join(tmpdir(), "favorites-"));
  });

  afterEach(async() => {
    await rm(directory, { recursive: true, force: true });
  });

  describe("fetchAll", () => {
    test("delivers every post file, newest first", async() => {
      await writePostFile("old", 1_000);
      await writePostFile("new", 3_000);
      await writePostFile("middle", 2_000);
      const delivered: Post[] = [];

      await new FileSystemFavoritesSource(directory).fetchAll(posts => delivered.push(...posts));
      expect(idsOf(delivered)).toEqual(["new", "middle", "old"]);
    });

    test("ignores files that are not post files", async() => {
      await writePostFile("1", 1_000);
      await writeFile(join(directory, "notes.txt"), "not a post");
      const delivered: Post[] = [];

      await new FileSystemFavoritesSource(directory).fetchAll(posts => delivered.push(...posts));
      expect(idsOf(delivered)).toEqual(["1"]);
    });
  });

  describe("count", () => {
    test("counts post files only", async() => {
      await writePostFile("1", 1_000);
      await writePostFile("2", 2_000);
      await writeFile(join(directory, "notes.txt"), "not a post");

      expect(await new FileSystemFavoritesSource(directory).count()).toBe(2);
    });
  });

  describe("fetchNew", () => {
    test("returns only posts not already known", async() => {
      await writePostFile("1", 1_000);
      await writePostFile("2", 2_000);
      await writePostFile("3", 3_000);

      const result = await new FileSystemFavoritesSource(directory).fetchNew(new Set(["2"]));

      expect(idsOf(result)).toEqual(["3", "1"]);
    });
  });
});
