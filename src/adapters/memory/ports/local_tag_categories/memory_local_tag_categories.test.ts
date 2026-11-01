import { describe, expect, test } from "vitest";
import { MemoryLocalTagCategories } from "@/adapters/memory/ports/local_tag_categories/memory_local_tag_categories";
import { TagCategory } from "@/core/domain/tag_category/tag_category";

describe("MemoryLocalTagCategories", () => {
  test("reads back what it wrote, skipping missing tags", async() => {
    const localTagCategories = new MemoryLocalTagCategories();

    await localTagCategories.setMany(new Map([["alice", "character"], ["bob", "artist"]]));

    expect(await localTagCategories.getMany(["bob", "missing", "alice"])).toEqual(new Map([["bob", "artist"], ["alice", "character"]]));
  });

  test("overwrites a tag's category", async() => {
    const localTagCategories = new MemoryLocalTagCategories();

    await localTagCategories.setMany(new Map([["alice", "general"]]));
    await localTagCategories.setMany(new Map([["alice", "character"]]));

    expect(await localTagCategories.getMany(["alice"])).toEqual(new Map([["alice", "character"]]));
  });

  test("ignores mutations to a map after writing or reading it", async() => {
    const localTagCategories = new MemoryLocalTagCategories();
    const written = new Map([["alice", "character"]] as const);

    await localTagCategories.setMany(written);
    written.clear();
    (await localTagCategories.getMany(["alice"]) as Map<string, TagCategory>).clear();

    expect(await localTagCategories.getMany(["alice"])).toEqual(new Map([["alice", "character"]]));
  });
});
