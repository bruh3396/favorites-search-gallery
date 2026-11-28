import "fake-indexeddb/auto";
import { DEFAULT_INDEXED_DB_CLIENT_CONFIGURATION, IndexedDbClient } from "@/adapters/browser/indexed_db/indexed_db_client";
import { beforeEach, describe, expect, test } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { IndexedDbLocalSnippets } from "@/adapters/browser/ports/local_snippets/indexed_db_local_snippets";
import { createSnippet } from "@/testing/snippet";

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

function createLocalSnippets(): IndexedDbLocalSnippets {
  return new IndexedDbLocalSnippets(new IndexedDbClient(DEFAULT_INDEXED_DB_CLIENT_CONFIGURATION));
}

describe("IndexedDbLocalSnippets", () => {
  test("reads back what it wrote", async() => {
    const localSnippets = createLocalSnippets();

    await localSnippets.set(createSnippet({ name: "fruits" }));
    await localSnippets.set(createSnippet({ name: "pets" }));

    expect(await localSnippets.getAll()).toEqual([createSnippet({ name: "fruits" }), createSnippet({ name: "pets" })]);
  });

  test("overwrites a snippet with the same name", async() => {
    const localSnippets = createLocalSnippets();

    await localSnippets.set(createSnippet({ name: "fruits", query: "apple" }));
    await localSnippets.set(createSnippet({ name: "fruits", query: "banana" }));

    expect(await localSnippets.getAll()).toEqual([createSnippet({ name: "fruits", query: "banana" })]);
  });

  test("renames a snippet, dropping its previous name", async() => {
    const localSnippets = createLocalSnippets();

    await localSnippets.set(createSnippet({ name: "fruits" }));
    await localSnippets.set(createSnippet({ name: "pets" }));
    await localSnippets.rename("fruits", createSnippet({ name: "produce", query: "banana" }));

    expect(await localSnippets.getAll()).toEqual([createSnippet({ name: "pets" }), createSnippet({ name: "produce", query: "banana" })]);
  });

  test("renames a snippet when only its case changes", async() => {
    const localSnippets = createLocalSnippets();

    await localSnippets.set(createSnippet({ name: "fruits" }));
    await localSnippets.rename("fruits", createSnippet({ name: "Fruits" }));

    expect(await localSnippets.getAll()).toEqual([createSnippet({ name: "Fruits" })]);
  });

  test("keeps a snippet renamed to its own name", async() => {
    const localSnippets = createLocalSnippets();

    await localSnippets.set(createSnippet({ name: "fruits", query: "apple" }));
    await localSnippets.rename("fruits", createSnippet({ name: "fruits", query: "banana" }));

    expect(await localSnippets.getAll()).toEqual([createSnippet({ name: "fruits", query: "banana" })]);
  });

  test("deletes a snippet by name", async() => {
    const localSnippets = createLocalSnippets();

    await localSnippets.set(createSnippet({ name: "fruits" }));
    await localSnippets.set(createSnippet({ name: "pets" }));
    await localSnippets.delete("fruits");
    await localSnippets.delete("missing");

    expect(await localSnippets.getAll()).toEqual([createSnippet({ name: "pets" })]);
  });

});
