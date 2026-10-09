import "fake-indexeddb/auto";
import { beforeEach, describe, expect, test } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { IndexedDbClient } from "@/adapters/indexed_db/client/client";

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

function createIndexedDb(): IndexedDbClient {
  return new IndexedDbClient();
}

function openRaw(version: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("favorites-search-gallery", version);

    request.onsuccess = (): void => {
      request.result.close();
      resolve();
    };
    request.onerror = (): void => reject(request.error);
  });
}

function deleteRaw(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase("favorites-search-gallery");

    request.onsuccess = (): void => resolve();
    request.onerror = (): void => reject(request.error);
  });
}

describe("IndexedDbClient", () => {
  test("returns what the requests read once the transaction commits", async() => {
    const indexedDb = createIndexedDb();

    await indexedDb.runTransaction("favorites", "readwrite", store => store.put(["1"], "owner"));
    const request = await indexedDb.runTransaction(
      "favorites",
      "readonly",
      store => store.get("owner") as IDBRequest<string[]>
    );

    expect(request.result).toEqual(["1"]);
  });

  test("rejects when the transaction aborts", async() => {
    const indexedDb = createIndexedDb();

    await indexedDb.runTransaction("posts", "readwrite", store => store.add({ id: "1" }));

    await expect(indexedDb.runTransaction("posts", "readwrite", store => store.add({ id: "1" }))).rejects.toThrow();
  });

  test("undoes every write of an aborted transaction", async() => {
    const indexedDb = createIndexedDb();

    await indexedDb.runTransaction("posts", "readwrite", store => store.add({ id: "1" }));
    await indexedDb.runTransaction("posts", "readwrite", store => {
      store.add({ id: "2" });
      store.add({ id: "1" });
    }).catch(() => undefined);
    const request = await indexedDb.runTransaction("posts", "readonly", store => store.get("2"));

    expect(request.result).toBeUndefined();
  });

  test("rejects when the database can't open, then opens on a later transaction", async() => {
    const indexedDb = createIndexedDb();

    await openRaw(2);
    await expect(indexedDb.runTransaction("posts", "readonly", store => store.count())).rejects.toThrow();
    await deleteRaw();

    expect((await indexedDb.runTransaction("posts", "readonly", store => store.count())).result).toBe(0);
  });

  test("lets a newer connection upgrade the database, then reopens", async() => {
    const indexedDb = createIndexedDb();

    await indexedDb.runTransaction("posts", "readwrite", store => store.add({ id: "1" }));
    await deleteRaw();

    expect((await indexedDb.runTransaction("posts", "readonly", store => store.count())).result).toBe(0);
  });
});
