import "fake-indexeddb/auto";
import { beforeEach, describe, expect, test } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { IndexedDbClient } from "@/adapters/indexed_db/client/client";
import { IndexedDbLocalTagCategories } from "@/adapters/indexed_db/ports/local_tag_categories/local_tag_categories";

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

function createLocalTagCategories(): IndexedDbLocalTagCategories {
  return new IndexedDbLocalTagCategories(new IndexedDbClient());
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
});
