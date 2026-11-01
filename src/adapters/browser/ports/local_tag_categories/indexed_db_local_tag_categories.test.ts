import "fake-indexeddb/auto";
import { DEFAULT_INDEXED_DB_CONFIGURATION, IndexedDbClient } from "@/adapters/browser/indexed_db/indexed_db_client";
import { beforeEach, describe, expect, test } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { IndexedDbLocalTagCategories } from "@/adapters/browser/ports/local_tag_categories/indexed_db_local_tag_categories";

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

function createLocalTagCategories(): IndexedDbLocalTagCategories {
  return new IndexedDbLocalTagCategories(new IndexedDbClient(DEFAULT_INDEXED_DB_CONFIGURATION, () => null));
}

describe("IndexedDbLocalTagCategories", () => {
  test("reads back what it wrote, skipping missing tags", async() => {
    const localTagCategories = createLocalTagCategories();

    await localTagCategories.setMany(new Map([["alice", "character"], ["bob", "artist"]]));

    const found = await localTagCategories.getMany(["bob", "missing", "alice"]);

    expect(found).toEqual(new Map([["bob", "artist"], ["alice", "character"]]));
  });

  test("overwrites a tag's category", async() => {
    const localTagCategories = createLocalTagCategories();

    await localTagCategories.setMany(new Map([["alice", "general"]]));
    await localTagCategories.setMany(new Map([["alice", "character"]]));

    expect(await localTagCategories.getMany(["alice"])).toEqual(new Map([["alice", "character"]]));
  });
});
