import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { MediaMinter } from "@/core/domain/media/media_minter";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/memory_local_keyed_values";
import { V1Storage } from "@/adapters/browser/v1_storage/v1_storage";
import { mintRule34CdnMedia } from "@/adapters/rule34_cdn/client/rule34_cdn_media_minter";
import { parseRule34CdnFileUrl } from "@/adapters/rule34_cdn/client/rule34_cdn_file_url_parser";

type Row = Record<string, unknown>;

const V1_LOCAL_KEYS = ["searchSnippets", "savedSearches", "customTags", "searchHistory", "lastEditedSearchQuery", "aspectRatios", "storedVideoClips"];

const mintMediaFromUrl: MediaMinter = ({ url, tags }) => {
  const rule34CdnLocator = parseRule34CdnFileUrl(url);
  return rule34CdnLocator === null ? null : mintRule34CdnMedia({ rule34CdnLocator, tags });
};

function createV1Storage(localKeyedValues = new MemoryLocalKeyedValues()): V1Storage {
  return new V1Storage({ mintMedia: mintMediaFromUrl, localKeyedValues });
}

function createV1Post(postId: string, overrides: Row = {}): Row {
  return {
    id: postId,
    width: 100,
    height: 200,
    score: 5,
    rating: "explicit",
    change: 1_700_000_000,
    fileURL: `https://api-cdn.rule34.xxx/images/1234/${postId}abc.png`,
    previewURL: `https://api-cdn.rule34.xxx/thumbnails/1234/thumbnail_${postId}abc.jpg`,
    tags: "tag_a tag_b",
    ...overrides
  };
}

function createV1Database({ name, stores, keyed }: { name: string; stores: Record<string, Row[]>; keyed: boolean }): Promise<void> {
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

async function databaseNames(): Promise<(string | undefined)[]> {
  return (await indexedDB.databases()).map(database => database.name);
}

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("V1Storage", () => {
  describe("read", () => {
    test("reads nothing when no 1.x storage exists", async() => {
      expect(await createV1Storage().read()).toBeNull();
    });

    test("reads nothing when the browser can't list its databases", async() => {
      await createV1Database({ name: "FavoritesV2", stores: { user1: [createV1Post("1")] }, keyed: false });
      vi.spyOn(indexedDB, "databases").mockRejectedValue(new Error("unsupported"));

      expect(await createV1Storage().read()).toBeNull();
    });

    test("reads each owner's favorite ids, newest first", async() => {
      await createV1Database({ name: "FavoritesV2", stores: {
        user1: [createV1Post("10"), createV1Post("20"), createV1Post("30")],
        user2: [createV1Post("40")]
      }, keyed: false });

      expect((await createV1Storage().read())?.favoriteIdsByOwnerId).toEqual(new Map([["1", ["30", "20", "10"]], ["2", ["40"]]]));
    });

    test("skips favorites stores without an owner or rows, but keeps their posts", async() => {
      await createV1Database({ name: "FavoritesV2", stores: {
        user: [createV1Post("10")],
        other1: [createV1Post("20")],
        user3: []
      }, keyed: false });
      const v1StorageContents = await createV1Storage().read();

      expect(v1StorageContents?.favoriteIdsByOwnerId).toEqual(new Map());
      expect(v1StorageContents?.posts.map(post => post.id).sort()).toEqual(["10", "20"]);
    });

    test("converts 1.x posts to the new shape", async() => {
      await createV1Database({ name: "Posts", stores: {
        posts: [createV1Post("1", { duration: 12, deleted: false, fetchedAt: 5, extension: "png" })]
      }, keyed: true });

      expect((await createV1Storage().read())?.posts).toEqual([
{
        id: "1",
        width: 100,
        height: 200,
        score: 5,
        rating: "explicit",
        changedAt: 1_700_000_000_000,
        media: { kind: "image", locator: "1234/1abc.png" },
        tags: "tag_a tag_b",
        durationSeconds: 12,
        status: "active",
        fetchedAt: 5
      }
]);
    });

    test("converts a deleted 1.x post to the deleted status", async() => {
      await createV1Database({ name: "Posts", stores: { posts: [createV1Post("1", { deleted: true })] }, keyed: true });

      expect((await createV1Storage().read())?.posts).toMatchObject([{ status: "deleted" }]);
    });

    test("converts unknown ratings and plain thumbnails with their defaults", async() => {
      await createV1Database({ name: "Posts", stores: {
        posts: [createV1Post("1", { rating: "unknown", fileURL: "https://x/thumbnails/9/thumbnail_aa.jpg" })]
      }, keyed: true });

      expect((await createV1Storage().read())?.posts).toMatchObject([{ rating: "explicit", media: { kind: "image", locator: "9/aa" } }]);
    });

    test("reads a post stored in both databases once, preferring the Posts database, since Firefox slows down on every rejected add", async() => {
      await createV1Database({ name: "Posts", stores: { posts: [createV1Post("1", { score: 99 })] }, keyed: true });
      await createV1Database({ name: "FavoritesV2", stores: { user1: [createV1Post("1", { score: 1 }), createV1Post("2")] }, keyed: false });

      expect((await createV1Storage().read())?.posts).toMatchObject([{ id: "1", score: 99 }, { id: "2" }]);
    });

    test("uses a known extension when the file URL is a thumbnail", async() => {
      await createV1Database({ name: "Posts", stores: {
        posts: [
          createV1Post("1", { fileURL: "https://x/thumbnails/9/thumbnail_aa.jpg", extension: "mp4" }),
          createV1Post("2", { fileURL: "https://x/thumbnails/9/thumbnail_bb.jpg", tags: "animated" })
        ]
      }, keyed: true });

      expect((await createV1Storage().read())?.posts).toMatchObject([
        { media: { kind: "video", locator: "9/aa.mp4" } },
        { media: { kind: "gif", locator: "9/bb" } }
      ]);
    });

    test("reads the media of a favorites row from its compressed preview", async() => {
      await createV1Database({ name: "FavoritesV2", stores: {
        user1: [
          createV1Post("1", { fileURL: "", previewURL: "4461_929221e6e18e", extension: "jpeg" }),
          createV1Post("2", { fileURL: "", previewURL: "2075_9e223af24537", extension: "", tags: "video" })
        ]
      }, keyed: false });

      expect((await createV1Storage().read())?.posts).toMatchObject([
        { media: { kind: "image", locator: "4461/929221e6e18e.jpeg" } },
        { media: { kind: "video", locator: "2075/9e223af24537" } }
      ]);
    });

    test("skips posts whose media can't be read", async() => {
      await createV1Database({ name: "Posts", stores: {
        posts: [createV1Post("1", { fileURL: "nonsense" }), createV1Post("2", { fileURL: "nonsense", previewURL: undefined })]
      }, keyed: true });

      expect((await createV1Storage().read())?.posts).toEqual([]);
    });

    test("skips rows that aren't posts", async() => {
      await createV1Database({ name: "Posts", stores: { posts: [{ id: "1" }] }, keyed: true });

      expect((await createV1Storage().read())?.posts).toEqual([]);
    });

    test("reads valid tag categories by tag name", async() => {
      await createV1Database({ name: "TagCategories", stores: {
        tagCategories: [{ id: "alice", category: "artist" }, { id: "bogus", category: "nope" }, { id: "bob" }]
      }, keyed: false });

      expect((await createV1Storage().read())?.tagCategoryByTagName).toEqual(new Map([["alice", "artist"]]));
    });

    test("reads nothing from databases without their stores", async() => {
      await createV1Database({ name: "Posts", stores: {}, keyed: true });
      await createV1Database({ name: "TagCategories", stores: { other: [] }, keyed: false });

      expect(await createV1Storage().read()).toEqual({
        posts: [],
        favoriteIdsByOwnerId: new Map(),
        tagCategoryByTagName: new Map(),
        snippets: []
      });
    });

    test("reads valid snippets without any database", async() => {
      const localKeyedValues = new MemoryLocalKeyedValues();
      const snippet = { name: "cats", query: "cat ~dog", lastUsedAt: 2, createdAt: 1 };

      localKeyedValues.set("searchSnippets", [snippet, { name: "broken" }]);

      expect(await createV1Storage(localKeyedValues).read()).toEqual({
        posts: [],
        favoriteIdsByOwnerId: new Map(),
        tagCategoryByTagName: new Map(),
        snippets: [snippet]
      });
    });

    test("reads no snippets from a value that isn't a list", async() => {
      const localKeyedValues = new MemoryLocalKeyedValues();

      localKeyedValues.set("searchSnippets", { name: "cats" });

      expect(await createV1Storage(localKeyedValues).read()).toBeNull();
    });

    test("rejects when a database can't open", async() => {
      await createV1Database({ name: "Posts", stores: { posts: [createV1Post("1")] }, keyed: true });
      const failing: Partial<IDBOpenDBRequest> = { error: new DOMException("denied") };

      vi.spyOn(indexedDB, "open").mockImplementation(() => {
        queueMicrotask(() => failing.onerror?.call(failing as IDBOpenDBRequest, new Event("error")));
        return failing as IDBOpenDBRequest;
      });

      await expect(createV1Storage().read()).rejects.toThrow("denied");
    });

    test("rejects when reading a database aborts", async() => {
      await createV1Database({ name: "Posts", stores: { posts: [createV1Post("1")] }, keyed: true });
      const transaction = IDBDatabase.prototype.transaction;

      vi.spyOn(IDBDatabase.prototype, "transaction").mockImplementation(function openTransaction(this: IDBDatabase, ...args) {
        const opened = transaction.apply(this, args);

        queueMicrotask(() => opened.abort());
        return opened;
      });

      await expect(createV1Storage().read()).rejects.toBeNull();
    });
  });

  describe("delete", () => {
    test("deletes the 1.x databases and local keys, leaving everything else", async() => {
      const localKeyedValues = new MemoryLocalKeyedValues();

      await createV1Database({ name: "FavoritesV2", stores: { user1: [createV1Post("1")] }, keyed: false });
      await createV1Database({ name: "Posts", stores: { posts: [] }, keyed: true });
      await createV1Database({ name: "TagCategories", stores: { tagCategories: [] }, keyed: false });
      await createV1Database({ name: "favorites-search-gallery", stores: {}, keyed: true });
      [...V1_LOCAL_KEYS, "preferences", "favorites-search-gallery"].forEach(key => localKeyedValues.set(key, []));

      await createV1Storage(localKeyedValues).delete();

      await vi.waitFor(async() => expect(await databaseNames()).toEqual(["favorites-search-gallery"]));
      expect(V1_LOCAL_KEYS.map(key => localKeyedValues.get(key))).toEqual(V1_LOCAL_KEYS.map(() => undefined));
      expect(localKeyedValues.get("preferences")).toEqual([]);
      expect(localKeyedValues.get("favorites-search-gallery")).toEqual([]);
    });

    test("deletes the local keys but no database when the browser can't list its databases", async() => {
      const localKeyedValues = new MemoryLocalKeyedValues();

      await createV1Database({ name: "Posts", stores: { posts: [] }, keyed: true });
      localKeyedValues.set("searchSnippets", []);
      const databases = vi.spyOn(indexedDB, "databases").mockRejectedValueOnce(new Error("unsupported"));

      await createV1Storage(localKeyedValues).delete();

      expect(localKeyedValues.get("searchSnippets")).toBeUndefined();
      databases.mockRestore();
      expect(await databaseNames()).toEqual(["Posts"]);
    });
  });
});
