import { describe, expect, test } from "vitest";
import { MemoryLocalTagCategories } from "@/adapters/memory/ports/local_tag_categories/local_tag_categories";

describe("MemoryLocalTagCategories", () => {
  test("reads back what it wrote, skipping missing tags", async() => {
    const tagCategories = new MemoryLocalTagCategories();

    await tagCategories.setMany(new Map([["alice", "character"], ["bob", "artist"]]));

    expect(await tagCategories.getMany(["bob", "missing", "alice"])).toEqual(new Map([["bob", "artist"], ["alice", "character"]]));
  });

  test("overwrites a tag's category", async() => {
    const tagCategories = new MemoryLocalTagCategories();

    await tagCategories.setMany(new Map([["alice", "general"]]));
    await tagCategories.setMany(new Map([["alice", "character"]]));

    expect(await tagCategories.getMany(["alice"])).toEqual(new Map([["alice", "character"]]));
  });

  test("is unaffected by mutating a map after writing or reading it", async() => {
    const tagCategories = new MemoryLocalTagCategories();
    const written = new Map([["alice", "character"]] as const);

    await tagCategories.setMany(written);
    written.clear();
    (await tagCategories.getMany(["alice"])).clear();

    expect(await tagCategories.getMany(["alice"])).toEqual(new Map([["alice", "character"]]));
  });
});
