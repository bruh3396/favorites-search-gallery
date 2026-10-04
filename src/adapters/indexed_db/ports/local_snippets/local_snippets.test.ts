import "fake-indexeddb/auto";
import { beforeEach, describe, expect, test } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { IndexedDbClient } from "@/adapters/indexed_db/client/client";
import { IndexedDbLocalSnippets } from "@/adapters/indexed_db/ports/local_snippets/local_snippets";
import { Snippet } from "@/core/domain/snippet/snippet";

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

function createLocalSnippets(): IndexedDbLocalSnippets {
  return new IndexedDbLocalSnippets(new IndexedDbClient());
}

function createSnippet(name: string, query = "apple"): Snippet {
  return { name, query, lastUsedAt: 0, createdAt: 0 };
}

describe("IndexedDbLocalSnippets", () => {
  test("reads back what it wrote", async() => {
    const snippets = createLocalSnippets();

    await snippets.setMany([createSnippet("fruits"), createSnippet("pets")]);

    expect(await snippets.getAll()).toEqual([createSnippet("fruits"), createSnippet("pets")]);
  });

  test("overwrites a snippet with the same name", async() => {
    const snippets = createLocalSnippets();

    await snippets.setMany([createSnippet("fruits", "apple")]);
    await snippets.setMany([createSnippet("fruits", "banana")]);

    expect(await snippets.getAll()).toEqual([createSnippet("fruits", "banana")]);
  });

  test("deletes snippets by name", async() => {
    const snippets = createLocalSnippets();

    await snippets.setMany([createSnippet("fruits"), createSnippet("pets")]);
    await snippets.deleteMany(["fruits", "missing"]);

    expect(await snippets.getAll()).toEqual([createSnippet("pets")]);
  });

  test("replaces every snippet", async() => {
    const snippets = createLocalSnippets();

    await snippets.setMany([createSnippet("fruits")]);
    await snippets.replaceAll([createSnippet("pets")]);

    expect(await snippets.getAll()).toEqual([createSnippet("pets")]);
  });
});
