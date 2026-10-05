import "fake-indexeddb/auto";
import { beforeEach, describe, expect, test } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { IndexedDbClient } from "@/adapters/indexed_db/client/client";
import { IndexedDbLocalFavorites } from "@/adapters/indexed_db/ports/local_favorites/local_favorites";

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

function createIndexedDb(): IndexedDbClient {
  return new IndexedDbClient();
}

function createLocalFavorites(ownerId = "1"): IndexedDbLocalFavorites {
  return new IndexedDbLocalFavorites({ ownerId }, createIndexedDb());
}

describe("IndexedDbLocalFavorites", () => {
  test("starts empty", async() => {
    expect(await createLocalFavorites().getAll()).toEqual([]);
  });

  test("keeps the newest ids first", async() => {
    const favorites = createLocalFavorites();

    await favorites.prepend(["2", "1"]);
    await favorites.prepend(["4", "3"]);

    expect(await favorites.getAll()).toEqual(["4", "3", "2", "1"]);
  });

  test("replaces every id it holds when setting all", async() => {
    const favorites = createLocalFavorites();

    await favorites.prepend(["2", "1"]);
    await favorites.setAll(["4", "3"]);

    expect(await favorites.getAll()).toEqual(["4", "3"]);
  });

  test("moves an id it already holds to the front", async() => {
    const favorites = createLocalFavorites();

    await favorites.prepend(["3", "2", "1"]);
    await favorites.prepend(["1"]);

    expect(await favorites.getAll()).toEqual(["1", "3", "2"]);
  });

  test("keeps one copy of an id given twice in one call", async() => {
    const favorites = createLocalFavorites();

    await favorites.prepend(["2", "1", "2"]);

    expect(await favorites.getAll()).toEqual(["2", "1"]);
  });

  test("removes the given ids and keeps the rest in order", async() => {
    const favorites = createLocalFavorites();

    await favorites.prepend(["4", "3", "2", "1"]);
    await favorites.remove(["3", "1"]);

    expect(await favorites.getAll()).toEqual(["4", "2"]);
  });

  test("leaves other owners alone when removing", async() => {
    const indexedDb = createIndexedDb();
    const first = new IndexedDbLocalFavorites({ ownerId: "1" }, indexedDb);
    const second = new IndexedDbLocalFavorites({ ownerId: "2" }, indexedDb);

    await first.prepend(["1"]);
    await second.prepend(["1"]);
    await first.remove(["1"]);

    expect(await second.getAll()).toEqual(["1"]);
  });

  test("keeps owners in one namespace apart", async() => {
    const indexedDb = createIndexedDb();
    const first = new IndexedDbLocalFavorites({ ownerId: "1" }, indexedDb);
    const second = new IndexedDbLocalFavorites({ ownerId: "2" }, indexedDb);

    await first.prepend(["1"]);

    expect(await second.getAll()).toEqual([]);
  });
});
