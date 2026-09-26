import { MockInstance, afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPost, createPosts } from "@/testing/post";
import { FavoritesCollection } from "@/features/favorites/model/collection/collection";
import { FavoritesColumnarArena } from "@/features/favorites/model/collection/favorites_columnar_arena";
import { FavoritesItem } from "@/features/favorites/model/collection/favorites_item";

function idsOf(items: FavoritesItem[]): string[] {
  return items.map(item => item.id);
}

describe("FavoritesCollection", () => {
  let collection: FavoritesCollection;

  beforeEach(() => {
    collection = new FavoritesCollection();
  });

  describe("tag cleanliness", () => {
    let cacheTagSet: MockInstance;

    beforeEach(() => {
      cacheTagSet = vi.spyOn(FavoritesColumnarArena.prototype, "cacheTagSet");
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    test("setAll admits clean items", () => {
      collection.setAll(createPosts("1", "2"));
      expect(cacheTagSet).toHaveBeenCalledTimes(2);
    });

    test("append admits clean items", () => {
      collection.append(createPosts("1", "2"));
      expect(cacheTagSet).toHaveBeenCalledTimes(2);
    });

    test("appendDirty admits dirty items", () => {
      collection.appendDirty(createPosts("1", "2"));
      expect(cacheTagSet).not.toHaveBeenCalled();
    });

    test("prependDirty admits dirty items", () => {
      collection.prependDirty(createPosts("1", "2"));
      expect(cacheTagSet).not.toHaveBeenCalled();
    });
  });

  describe("ordering", () => {
    test("appendDirty adds items to the end", () => {
      collection.setAll(createPosts("1", "2"));
      collection.appendDirty(createPosts("3"));
      expect(idsOf(collection.getAll())).toEqual(["1", "2", "3"]);
    });

    test("prependDirty adds items to the front", () => {
      collection.setAll(createPosts("1", "2"));
      collection.prependDirty(createPosts("3"));
      expect(idsOf(collection.getAll())).toEqual(["3", "1", "2"]);
    });
  });

  describe("setAll", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    test("allocates replacement items from a fresh arena", () => {
      const allocate = vi.spyOn(FavoritesColumnarArena.prototype, "allocate");

      collection.setAll(createPosts("1", "2"));
      allocate.mockClear();
      collection.setAll(createPosts("3"));

      expect(allocate.mock.results.map(result => result.value)).toEqual([0]);
    });

    test("leaves replaced items readable", () => {
      const [replaced] = collection.setAll([createPost({ id: "1", tags: "apple" })]);

      collection.setAll([createPost({ id: "2", tags: "banana" })]);

      expect(replaced.id).toBe("1");
      expect(replaced.tags).toEqual(new Set(["apple"]));
    });
  });

  test("gives each admitted item its own slot", () => {
    collection.append([createPost({ id: "10", tags: "apple" }), createPost({ id: "20", tags: "banana" })]);

    expect(collection.get("10")?.tags).toEqual(new Set(["apple"]));
    expect(collection.get("20")?.tags).toEqual(new Set(["banana"]));
    expect(collection.getAllIds()).toEqual(new Set(["10", "20"]));
  });

  describe("compress", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    test("compresses the underlying arena", () => {
      const compress = vi.spyOn(FavoritesColumnarArena.prototype, "compress");

      collection.append(createPosts("1"));
      collection.compress();

      expect(compress).toHaveBeenCalledTimes(1);
    });
  });

  describe("setAll arena replacement", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    test("keeps the same arena when it is still empty", () => {
      const allocate = vi.spyOn(FavoritesColumnarArena.prototype, "allocate");

      collection.setAll(createPosts("1", "2"));

      expect(allocate.mock.results.map(result => result.value)).toEqual([0, 1]);
    });

    test("replaces a non-empty arena", () => {
      collection.append(createPosts("1"));

      const allocate = vi.spyOn(FavoritesColumnarArena.prototype, "allocate");

      collection.setAll(createPosts("2"));

      expect(allocate.mock.results.map(result => result.value)).toEqual([0]);
    });
  });
});
