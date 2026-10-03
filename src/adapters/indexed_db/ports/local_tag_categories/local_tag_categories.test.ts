import "fake-indexeddb/auto";
import { describe, expect, test } from "vitest";
import { IndexedDbClient } from "@/adapters/indexed_db/client/client";
import { IndexedDbLocalTagCategories } from "@/adapters/indexed_db/ports/local_tag_categories/local_tag_categories";

let counter = 0;

function createLocalTagCategories(): IndexedDbLocalTagCategories {
  counter += 1;
  return new IndexedDbLocalTagCategories(new IndexedDbClient(`local_tag_categories_test_${counter}`));
}

describe("IndexedDbLocalTagCategories", () => {
  test("reads back what it wrote, skipping missing tags", async() => {
    const tagCategories = createLocalTagCategories();

    await tagCategories.setMany(new Map([["alice", "character"], ["bob", "artist"]]));

    const found = await tagCategories.getMany(["bob", "missing", "alice"]);

    expect(found).toEqual(new Map([["bob", "artist"], ["alice", "character"]]));
  });

  test("overwrites a tag's category", async() => {
    const tagCategories = createLocalTagCategories();

    await tagCategories.setMany(new Map([["alice", "general"]]));
    await tagCategories.setMany(new Map([["alice", "character"]]));

    expect(await tagCategories.getMany(["alice"])).toEqual(new Map([["alice", "character"]]));
  });

  test("keeps namespaces apart", async() => {
    const first = createLocalTagCategories();
    const second = createLocalTagCategories();

    await first.setMany(new Map([["alice", "character"]]));

    expect(await second.getMany(["alice"])).toEqual(new Map());
  });
});
