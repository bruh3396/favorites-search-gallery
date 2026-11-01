import "fake-indexeddb/auto";
import { DEFAULT_INDEXED_DB_CONFIGURATION, IndexedDbClient } from "@/adapters/browser/indexed_db/indexed_db_client";
import { beforeEach, describe, expect, test } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { IndexedDbLocalFavorites } from "@/adapters/browser/ports/local_favorites/indexed_db_local_favorites";

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

function createIndexedDb(): IndexedDbClient {
  return new IndexedDbClient(DEFAULT_INDEXED_DB_CONFIGURATION, () => null);
}

function createLocalFavorites(ownerId = "1"): IndexedDbLocalFavorites {
  return new IndexedDbLocalFavorites({ ownerId }, createIndexedDb());
}

describe("IndexedDbLocalFavorites", () => {
  test("starts empty", async() => {
    expect(await createLocalFavorites().getAll()).toEqual([]);
  });

  test("keeps the newest ids first", async() => {
    const localFavorites = createLocalFavorites();

    await localFavorites.prepend(["2", "1"]);
    await localFavorites.prepend(["4", "3"]);

    expect(await localFavorites.getAll()).toEqual(["4", "3", "2", "1"]);
  });

  test("replaces every id it holds when setting all", async() => {
    const localFavorites = createLocalFavorites();

    await localFavorites.prepend(["2", "1"]);
    await localFavorites.setAll(["4", "3"]);

    expect(await localFavorites.getAll()).toEqual(["4", "3"]);
  });

  test("moves an id it already holds to the front", async() => {
    const localFavorites = createLocalFavorites();

    await localFavorites.prepend(["3", "2", "1"]);
    await localFavorites.prepend(["1"]);

    expect(await localFavorites.getAll()).toEqual(["1", "3", "2"]);
  });

  test("keeps one copy of an id given twice in one call", async() => {
    const localFavorites = createLocalFavorites();

    await localFavorites.prepend(["2", "1", "2"]);

    expect(await localFavorites.getAll()).toEqual(["2", "1"]);
  });

  test("removes the given ids and keeps the rest in order", async() => {
    const localFavorites = createLocalFavorites();

    await localFavorites.prepend(["4", "3", "2", "1"]);
    await localFavorites.remove(["3", "1"]);

    expect(await localFavorites.getAll()).toEqual(["4", "2"]);
  });

  test("leaves other owners alone when removing", async() => {
    const indexedDbClient = createIndexedDb();
    const firstLocalFavorites = new IndexedDbLocalFavorites({ ownerId: "1" }, indexedDbClient);
    const secondLocalFavorites = new IndexedDbLocalFavorites({ ownerId: "2" }, indexedDbClient);

    await firstLocalFavorites.prepend(["1"]);
    await secondLocalFavorites.prepend(["1"]);
    await firstLocalFavorites.remove(["1"]);

    expect(await secondLocalFavorites.getAll()).toEqual(["1"]);
  });

  test("keeps owners in one namespace apart", async() => {
    const indexedDbClient = createIndexedDb();
    const firstLocalFavorites = new IndexedDbLocalFavorites({ ownerId: "1" }, indexedDbClient);
    const secondLocalFavorites = new IndexedDbLocalFavorites({ ownerId: "2" }, indexedDbClient);

    await firstLocalFavorites.prepend(["1"]);

    expect(await secondLocalFavorites.getAll()).toEqual([]);
  });
});
