import { afterEach, describe, expect, test, vi } from "vitest";
import { createPost, createPosts } from "@/testing/post";
import { ArenaFavorite } from "@/features/favorites/model/collection/arena_favorite";
import { FavoritesCollection } from "@/features/favorites/model/collection/collection";
import { FavoritesColumnarArena } from "@/features/favorites/model/collection/favorites_columnar_arena";

function getIds(items: ArenaFavorite[]): string[] {
  return items.map(item => item.id);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("FavoritesCollection", () => {
  describe("setAll", () => {
    test("admits clean items", () => {
      const cacheTagSet = vi.spyOn(FavoritesColumnarArena.prototype, "cacheTagSet");

      new FavoritesCollection().setAll(createPosts("1", "2"));
      expect(cacheTagSet).toHaveBeenCalledTimes(2);
    });

    test("keeps the same arena when it is still empty", () => {
      const allocate = vi.spyOn(FavoritesColumnarArena.prototype, "allocate");

      new FavoritesCollection().setAll(createPosts("1", "2"));
      expect(allocate.mock.results.map(result => result.value)).toEqual([0, 1]);
    });

    test("allocates replacement items from a fresh arena", () => {
      const collection = new FavoritesCollection();
      const allocate = vi.spyOn(FavoritesColumnarArena.prototype, "allocate");

      collection.setAll(createPosts("1", "2"));
      allocate.mockClear();
      collection.setAll(createPosts("3"));
      expect(allocate.mock.results.map(result => result.value)).toEqual([0]);
    });

    test("replaces an arena filled by append", () => {
      const collection = new FavoritesCollection();

      collection.append(createPosts("1"));
      const allocate = vi.spyOn(FavoritesColumnarArena.prototype, "allocate");

      collection.setAll(createPosts("2"));
      expect(allocate.mock.results.map(result => result.value)).toEqual([0]);
    });

    test("leaves replaced items readable", () => {
      const collection = new FavoritesCollection();
      const [replaced] = collection.setAll([createPost({ id: "1", tags: "apple" })]);

      collection.setAll([createPost({ id: "2", tags: "banana" })]);
      expect(replaced.id).toBe("1");
      expect(replaced.tags).toEqual(new Set(["apple"]));
    });
  });

  describe("append", () => {
    test("admits clean items", () => {
      const cacheTagSet = vi.spyOn(FavoritesColumnarArena.prototype, "cacheTagSet");

      new FavoritesCollection().append(createPosts("1", "2"));
      expect(cacheTagSet).toHaveBeenCalledTimes(2);
    });

    test("gives each admitted item its own slot", () => {
      const collection = new FavoritesCollection();

      collection.append([createPost({ id: "10", tags: "apple" }), createPost({ id: "20", tags: "banana" })]);
      expect(collection.get("10")?.tags).toEqual(new Set(["apple"]));
      expect(collection.get("20")?.tags).toEqual(new Set(["banana"]));
      expect(collection.getAllIds()).toEqual(new Set(["10", "20"]));
    });
  });

  describe("appendDirty", () => {
    test("admits dirty items", () => {
      const cacheTagSet = vi.spyOn(FavoritesColumnarArena.prototype, "cacheTagSet");

      new FavoritesCollection().appendDirty(createPosts("1", "2"));
      expect(cacheTagSet).not.toHaveBeenCalled();
    });

    test("adds items to the end", () => {
      const collection = new FavoritesCollection();

      collection.setAll(createPosts("1", "2"));
      collection.appendDirty(createPosts("3"));
      expect(getIds(collection.getAll())).toEqual(["1", "2", "3"]);
    });
  });

  describe("prependDirty", () => {
    test("admits dirty items", () => {
      const cacheTagSet = vi.spyOn(FavoritesColumnarArena.prototype, "cacheTagSet");

      new FavoritesCollection().prependDirty(createPosts("1", "2"));
      expect(cacheTagSet).not.toHaveBeenCalled();
    });

    test("adds items to the front", () => {
      const collection = new FavoritesCollection();

      collection.setAll(createPosts("1", "2"));
      collection.prependDirty(createPosts("3"));
      expect(getIds(collection.getAll())).toEqual(["3", "1", "2"]);
    });
  });

  describe("getTags", () => {
    test("reads the tags of the given favorites, skipping missing ones", () => {
      const collection = new FavoritesCollection();

      collection.append([createPost({ id: "10", tags: "apple" }), createPost({ id: "20", tags: "banana" })]);
      expect(collection.getTags(["20", "30"])).toEqual(new Map([["20", new Set(["banana"])]]));
    });
  });

  describe("compress", () => {
    test("compresses the underlying arena", () => {
      const collection = new FavoritesCollection();
      const compress = vi.spyOn(FavoritesColumnarArena.prototype, "compress");

      collection.append(createPosts("1"));
      collection.compress();
      expect(compress).toHaveBeenCalledOnce();
    });
  });
});
