import "fake-indexeddb/auto";
import { DEFAULT_INDEXED_DB_CLIENT_CONFIGURATION, IndexedDbClient } from "@/adapters/browser/indexed_db/indexed_db_client";
import { beforeEach, describe, expect, test } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { IndexedDbLocalSnippets } from "@/adapters/browser/ports/local_snippets/indexed_db_local_snippets";
import { Snippet } from "@/core/domain/snippet/snippet";

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

function createLocalSnippets(): IndexedDbLocalSnippets {
  return new IndexedDbLocalSnippets(new IndexedDbClient(DEFAULT_INDEXED_DB_CLIENT_CONFIGURATION, () => null));
}

function createSnippet(name: string, query = "apple"): Snippet {
  return { name, query, lastUsedAt: 0, createdAt: 0 };
}

describe("IndexedDbLocalSnippets", () => {
  test("reads back what it wrote", async() => {
    const localSnippets = createLocalSnippets();

    await localSnippets.setMany([createSnippet("fruits"), createSnippet("pets")]);

    expect(await localSnippets.getAll()).toEqual([createSnippet("fruits"), createSnippet("pets")]);
  });

  test("overwrites a snippet with the same name", async() => {
    const localSnippets = createLocalSnippets();

    await localSnippets.setMany([createSnippet("fruits", "apple")]);
    await localSnippets.setMany([createSnippet("fruits", "banana")]);

    expect(await localSnippets.getAll()).toEqual([createSnippet("fruits", "banana")]);
  });

  test("deletes snippets by name", async() => {
    const localSnippets = createLocalSnippets();

    await localSnippets.setMany([createSnippet("fruits"), createSnippet("pets")]);
    await localSnippets.deleteMany(["fruits", "missing"]);

    expect(await localSnippets.getAll()).toEqual([createSnippet("pets")]);
  });

  test("replaces every snippet", async() => {
    const localSnippets = createLocalSnippets();

    await localSnippets.setMany([createSnippet("fruits")]);
    await localSnippets.replaceAll([createSnippet("pets")]);

    expect(await localSnippets.getAll()).toEqual([createSnippet("pets")]);
  });
});
