import "fake-indexeddb/auto";
import { DEFAULT_INDEXED_DB_CLIENT_CONFIGURATION, IndexedDbClient } from "@/adapters/browser/indexed_db/indexed_db_client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { V1Storage } from "@/adapters/browser/v1_storage/v1_storage";
import { V1StorageContents } from "@/adapters/browser/v1_storage/v1_storage_contents";
import { createPost } from "@/testing/post";
import { createSnippet } from "@/testing/snippet";

const V1_STORAGE_CONTENTS: V1StorageContents = {
  posts: [createPost({ id: "1" })],
  favoriteIdsByOwnerId: new Map([["owner", ["1"]]]),
  tagCategoryByTagName: new Map([["alice", "artist"]]),
  snippets: [createSnippet({ name: "cats" })]
};

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function createIndexedDb(): IndexedDbClient {
  return new IndexedDbClient(DEFAULT_INDEXED_DB_CLIENT_CONFIGURATION);
}

function createV1Storage(v1StorageContents: V1StorageContents | null = V1_STORAGE_CONTENTS): Pick<V1Storage, "read" | "delete"> {
  return { read: vi.fn(() => Promise.resolve(v1StorageContents)), delete: vi.fn(() => Promise.resolve()) };
}

async function readAll(indexedDbClient: IndexedDbClient): Promise<Record<string, unknown>> {
  const get = async(storeName: "favorites" | "posts" | "snippets" | "tagCategories", key: string): Promise<unknown> => (
    (await indexedDbClient.runTransaction(storeName, "readonly", store => store.get(key))).result
  );
  return {
    posts: await get("posts", "1"),
    favorites: await get("favorites", "owner"),
    tagCategories: await get("tagCategories", "alice"),
    snippets: await get("snippets", "cats")
  };
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
    const indexedDbClient = createIndexedDb();

    await indexedDbClient.runTransaction("favorites", "readwrite", store => store.put(["1"], "owner"));
    const request = await indexedDbClient.runTransaction(
      "favorites",
      "readonly",
      store => store.get("owner") as IDBRequest<string[]>
    );

    expect(request.result).toEqual(["1"]);
  });

  test("rejects when the transaction aborts", async() => {
    const indexedDbClient = createIndexedDb();

    await indexedDbClient.runTransaction("posts", "readwrite", store => store.add({ id: "1" }));

    await expect(indexedDbClient.runTransaction("posts", "readwrite", store => store.add({ id: "1" }))).rejects.toThrow();
  });

  test("undoes every write of an aborted transaction", async() => {
    const indexedDbClient = createIndexedDb();

    await indexedDbClient.runTransaction("posts", "readwrite", store => store.add({ id: "1" }));
    await indexedDbClient.runTransaction("posts", "readwrite", store => {
      store.add({ id: "2" });
      store.add({ id: "1" });
    }).catch(() => undefined);
    const request = await indexedDbClient.runTransaction("posts", "readonly", store => store.get("2"));

    expect(request.result).toBeUndefined();
  });

  test("rejects when the database can't open, then opens on a later transaction", async() => {
    const indexedDbClient = createIndexedDb();

    await openRaw(2);
    await expect(indexedDbClient.runTransaction("posts", "readonly", store => store.count())).rejects.toThrow();
    await deleteRaw();

    expect((await indexedDbClient.runTransaction("posts", "readonly", store => store.count())).result).toBe(0);
  });

  test("lets a newer connection upgrade the database, then reopens", async() => {
    const indexedDbClient = createIndexedDb();

    await indexedDbClient.runTransaction("posts", "readwrite", store => store.add({ id: "1" }));
    await deleteRaw();

    expect((await indexedDbClient.runTransaction("posts", "readonly", store => store.count())).result).toBe(0);
  });

  test("writes the 1.x storage contents into a new database, then deletes the 1.x storage", async() => {
    const v1Storage = createV1Storage();
    const indexedDbClient = new IndexedDbClient(DEFAULT_INDEXED_DB_CLIENT_CONFIGURATION, v1Storage);

    expect(await readAll(indexedDbClient)).toEqual({
      posts: createPost({ id: "1" }),
      favorites: ["1"],
      tagCategories: "artist",
      snippets: createSnippet({ name: "cats" })
    });
    expect(v1Storage.delete).toHaveBeenCalledOnce();
  });

  test("deletes the 1.x storage only once the database exists", async() => {
    const v1Storage = createV1Storage();

    vi.mocked(v1Storage.delete).mockImplementation(async() => {
      expect((await indexedDB.databases()).map(database => database.name)).toEqual(["favorites-search-gallery"]);
    });

    await readAll(new IndexedDbClient(DEFAULT_INDEXED_DB_CLIENT_CONFIGURATION, v1Storage));

    expect(v1Storage.delete).toHaveBeenCalledOnce();
  });

  test("leaves an existing database untouched, but still deletes the 1.x storage", async() => {
    await createIndexedDb().runTransaction("favorites", "readwrite", store => store.put(["new"], "owner"));
    const v1Storage = createV1Storage();

    expect(await readAll(new IndexedDbClient(DEFAULT_INDEXED_DB_CLIENT_CONFIGURATION, v1Storage))).toEqual({
      posts: undefined,
      favorites: ["new"],
      tagCategories: undefined,
      snippets: undefined
    });
    expect(v1Storage.delete).toHaveBeenCalledOnce();
  });

  test("keeps writing when one write is rejected", async() => {
    const v1Storage = createV1Storage({
      ...V1_STORAGE_CONTENTS,
      posts: [createPost({ id: "1", score: 1 }), createPost({ id: "1", score: 2 })]
    });

    expect(await readAll(new IndexedDbClient(DEFAULT_INDEXED_DB_CLIENT_CONFIGURATION, v1Storage))).toMatchObject({
      posts: { score: 1 },
      favorites: ["1"],
      tagCategories: "artist",
      snippets: { name: "cats" }
    });
  });

  test("creates an empty database when the 1.x storage holds nothing", async() => {
    const v1Storage = createV1Storage(null);

    expect(await readAll(new IndexedDbClient(DEFAULT_INDEXED_DB_CLIENT_CONFIGURATION, v1Storage))).toEqual({
      posts: undefined,
      favorites: undefined,
      tagCategories: undefined,
      snippets: undefined
    });
    expect(v1Storage.delete).toHaveBeenCalledOnce();
  });
});
