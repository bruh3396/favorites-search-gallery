import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { mkdtemp, readdir, rm, utimes, writeFile } from "node:fs/promises";
import { FilesystemClient } from "@/adapters/filesystem/client/client";
import { createPost } from "@/testing/post";
import { join } from "node:path";
import { tmpdir } from "node:os";

let directory: string;

async function writePostFile(id: string, modifiedAtSeconds: number): Promise<void> {
  const path = join(directory, `${id}.json`);

  await writeFile(path, JSON.stringify(createPost({ id })));
  await utimes(path, modifiedAtSeconds, modifiedAtSeconds);
}

describe("FilesystemClient", () => {
  beforeEach(async() => {
    directory = await mkdtemp(join(tmpdir(), "favorites-"));
  });

  afterEach(async() => {
    await rm(directory, { recursive: true, force: true });
  });

  test("reads each post file with when it was modified, ignoring other files", async() => {
    await writePostFile("1", 1_000);
    await writeFile(join(directory, "notes.txt"), "not a post");

    const files = await new FilesystemClient(directory).readPostFiles();

    expect(files.map(file => [file.post.id, file.modifiedAt])).toEqual([["1", 1_000_000]]);
  });

  test("counts post files only", async() => {
    await writePostFile("1", 1_000);
    await writePostFile("2", 2_000);
    await writeFile(join(directory, "notes.txt"), "not a post");

    expect(await new FilesystemClient(directory).countPostFiles()).toBe(2);
  });

  test("deletes a post's file, and ignores a post without one", async() => {
    await writeFile(join(directory, "1.json"), "{}");
    await writeFile(join(directory, "2.json"), "{}");
    const client = new FilesystemClient(directory);

    await client.deletePostFile("1");
    await client.deletePostFile("9");
    expect(await readdir(directory)).toEqual(["2.json"]);
  });
});
