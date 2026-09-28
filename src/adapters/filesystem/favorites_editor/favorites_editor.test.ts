import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { FileSystemFavoritesEditor } from "@/adapters/filesystem/favorites_editor/favorites_editor";
import { join } from "node:path";
import { tmpdir } from "node:os";

let directory: string;

describe("FileSystemFavoritesEditor", () => {
  beforeEach(async() => {
    directory = await mkdtemp(join(tmpdir(), "favorites-"));
  });

  afterEach(async() => {
    await rm(directory, { recursive: true, force: true });
  });

  test("removing deletes the post's file, and ignores a post without one", async() => {
    await writeFile(join(directory, "1.json"), "{}");
    await writeFile(join(directory, "2.json"), "{}");
    const editor = new FileSystemFavoritesEditor(directory);

    await editor.remove("1");
    await editor.remove("9");

    expect(await readdir(directory)).toEqual(["2.json"]);
  });
});
