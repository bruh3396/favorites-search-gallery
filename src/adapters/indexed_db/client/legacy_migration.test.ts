import "fake-indexeddb/auto";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { IndexedDbClient } from "@/adapters/indexed_db/client/client";

type Row = Record<string, unknown>;

function createLegacyPost(id: string, overrides: Row = {}): Row {
  return {
    id,
    width: 100,
    height: 200,
    score: 5,
    rating: "explicit",
    change: 1_700_000_000,
    fileURL: `https://api-cdn.rule34.xxx/images/1234/${id}abc.png`,
    previewURL: `https://api-cdn.rule34.xxx/thumbnails/1234/thumbnail_${id}abc.jpg`,
    tags: "tag_a tag_b",
    ...overrides
  };
}

function createLegacyDatabase({ name, stores, keyed }: { name: string; stores: Record<string, Row[]>; keyed: boolean }): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, 1);

    request.onupgradeneeded = (): void => {
      for (const storeName of Object.keys(stores)) {
        if (keyed) {
          request.result.createObjectStore(storeName, { keyPath: "id" });
        } else {
          request.result.createObjectStore(storeName, { autoIncrement: true }).createIndex("id", "id", { unique: true });
        }
      }
    };
    request.onerror = (): void => reject(request.error);
    request.onsuccess = (): void => {
      const database = request.result;
      const storeNames = Object.keys(stores);

      if (storeNames.length === 0) {
        database.close();
        resolve();
        return;
      }
      const transaction = database.transaction(storeNames, "readwrite");

      storeNames.forEach(storeName => stores[storeName]?.forEach(row => transaction.objectStore(storeName).put(row)));
      transaction.oncomplete = (): void => {
        database.close();
        resolve();
      };
    };
  });
}

async function read(indexedDb: IndexedDbClient, storeName: "favorites" | "posts" | "tagCategories", key: string): Promise<unknown> {
  return (await indexedDb.runTransaction(storeName, "readonly", store => store.get(key))).result;
}

async function databaseNames(): Promise<(string | undefined)[]> {
  return (await indexedDB.databases()).map(database => database.name);
}

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

describe("prepareLegacyMigration", () => {
  test("moves each owner's favorites into the new store, newest first", async() => {
    await createLegacyDatabase({ name: "FavoritesV2", stores: {
      user1: [createLegacyPost("10"), createLegacyPost("20"), createLegacyPost("30")],
      user2: [createLegacyPost("40")]
    }, keyed: false });
    const indexedDb = new IndexedDbClient("rule34");

    expect(await read(indexedDb, "favorites", "1")).toEqual(["30", "20", "10"]);
    expect(await read(indexedDb, "favorites", "2")).toEqual(["40"]);
  });

  test("converts legacy posts to the new shape", async() => {
    await createLegacyDatabase({ name: "Posts", stores: {
      posts: [createLegacyPost("1", { duration: 12, deleted: false, fetchedAt: 5, extension: "png" })]
    }, keyed: true });
    const indexedDb = new IndexedDbClient("rule34");

    expect(await read(indexedDb, "posts", "1")).toEqual({
      id: "1",
      width: 100,
      height: 200,
      score: 5,
      rating: "explicit",
      changedAt: 1_700_000_000_000,
      media: { kind: "image", locator: "1234/1abc.png" },
      tags: "tag_a tag_b",
      durationSeconds: 12,
      deleted: false,
      fetchedAt: 5
    });
  });

  test("prefers a post from the Posts database over the same post in a favorites row", async() => {
    await createLegacyDatabase({ name: "Posts", stores: { posts: [createLegacyPost("1", { score: 99 })] }, keyed: true });
    await createLegacyDatabase({ name: "FavoritesV2", stores: { user1: [createLegacyPost("1", { score: 1 }), createLegacyPost("2")] }, keyed: false });
    const indexedDb = new IndexedDbClient("rule34");

    expect(await read(indexedDb, "posts", "1")).toMatchObject({ score: 99 });
    expect(await read(indexedDb, "posts", "2")).toMatchObject({ id: "2" });
  });

  test("uses a known extension when the file URL is a thumbnail", async() => {
    await createLegacyDatabase({ name: "Posts", stores: {
      posts: [
        createLegacyPost("1", { fileURL: "https://x/thumbnails/9/thumbnail_aa.jpg", extension: "mp4" }),
        createLegacyPost("2", { fileURL: "https://x/thumbnails/9/thumbnail_bb.jpg", tags: "animated" })
      ]
    }, keyed: true });
    const indexedDb = new IndexedDbClient("rule34");

    expect(await read(indexedDb, "posts", "1")).toMatchObject({ media: { kind: "video", locator: "9/aa.mp4" } });
    expect(await read(indexedDb, "posts", "2")).toMatchObject({ media: { kind: "gif", locator: "9/bb" } });
  });

  test("reads the media of a favorites row from its compressed preview", async() => {
    await createLegacyDatabase({ name: "FavoritesV2", stores: {
      user1: [
        createLegacyPost("1", { fileURL: "", previewURL: "4461_929221e6e18e", extension: "jpeg" }),
        createLegacyPost("2", { fileURL: "", previewURL: "2075_9e223af24537", extension: "", tags: "video" })
      ]
    }, keyed: false });
    const indexedDb = new IndexedDbClient("rule34");

    expect(await read(indexedDb, "posts", "1")).toMatchObject({ media: { kind: "image", locator: "4461/929221e6e18e.jpeg" } });
    expect(await read(indexedDb, "posts", "2")).toMatchObject({ media: { kind: "video", locator: "2075/9e223af24537" } });
  });

  test("skips posts whose media can't be read", async() => {
    await createLegacyDatabase({ name: "Posts", stores: { posts: [createLegacyPost("1", { fileURL: "nonsense" })] }, keyed: true });
    const indexedDb = new IndexedDbClient("rule34");

    expect(await read(indexedDb, "posts", "1")).toBeUndefined();
  });

  test("moves valid tag categories", async() => {
    await createLegacyDatabase({ name: "TagCategories", stores: {
      tagCategories: [{ id: "alice", category: "artist" }, { id: "bogus", category: "nope" }]
    }, keyed: false });
    const indexedDb = new IndexedDbClient("rule34");

    expect(await read(indexedDb, "tagCategories", "alice")).toBe("artist");
    expect(await read(indexedDb, "tagCategories", "bogus")).toBeUndefined();
  });

  test("deletes the legacy databases after migrating", async() => {
    await createLegacyDatabase({ name: "FavoritesV2", stores: { user1: [createLegacyPost("1")] }, keyed: false });
    await createLegacyDatabase({ name: "Posts", stores: { posts: [] }, keyed: true });
    await createLegacyDatabase({ name: "TagCategories", stores: { tagCategories: [] }, keyed: false });

    await read(new IndexedDbClient("rule34"), "favorites", "1");

    await vi.waitFor(async() => expect(await databaseNames()).toEqual(["fsg:rule34"]));
  });

  test("deletes legacy databases written after the migration without reading them", async() => {
    const indexedDb = new IndexedDbClient("rule34");

    await indexedDb.runTransaction("favorites", "readwrite", store => store.put(["new"], "1"));
    await createLegacyDatabase({ name: "FavoritesV2", stores: { user1: [createLegacyPost("old")] }, keyed: false });
    await createLegacyDatabase({ name: "Posts", stores: { posts: [createLegacyPost("old")] }, keyed: true });
    const reopened = new IndexedDbClient("rule34");

    expect(await read(reopened, "favorites", "1")).toEqual(["new"]);
    expect(await read(reopened, "posts", "old")).toBeUndefined();
    await vi.waitFor(async() => expect(await databaseNames()).toEqual(["fsg:rule34"]));
  });

  test("creates only the new database when no legacy database exists", async() => {
    await read(new IndexedDbClient("rule34"), "favorites", "1");

    expect(await databaseNames()).toEqual(["fsg:rule34"]);
  });
});
