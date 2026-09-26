import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPost, createPosts } from "@/testing/post";
import { DatabaseLike } from "@/lib/storage/database";
import { FavoritesStore } from "@/features/favorites/model/retrieval/store";
import { Post } from "@/types/api";

function createDatabase(overrides: Partial<DatabaseLike<Post>> = {}): DatabaseLike<Post> {
  return {
    exists: vi.fn().mockResolvedValue(true),
    readAll: vi.fn().mockResolvedValue([]),
    readAllStreamed: vi.fn().mockResolvedValue(undefined),
    readMany: vi.fn().mockResolvedValue([]),
    readAllIds: vi.fn().mockResolvedValue([]),
    write: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    count: vi.fn().mockResolvedValue(0),
    destroy: vi.fn().mockResolvedValue(undefined),
    ...overrides
  };
}

describe("FavoritesStore", () => {
  describe("when the database does not exist", () => {
    test("readAll returns an empty array without reading", async() => {
      const database = createDatabase({ exists: vi.fn().mockResolvedValue(false) });
      const store = new FavoritesStore(database);

      expect(await store.readAll()).toEqual([]);
      expect(database.readAll).not.toHaveBeenCalled();
    });

    test("streamAll delivers no batches", async() => {
      const database = createDatabase({ exists: vi.fn().mockResolvedValue(false) });
      const store = new FavoritesStore(database);
      const onBatch = vi.fn();

      await store.streamAll(onBatch);

      expect(onBatch).not.toHaveBeenCalled();
      expect(database.readAllStreamed).not.toHaveBeenCalled();
    });

    test("readMany, readIds, count, and hasAny short-circuit to defaults", async() => {
      const database = createDatabase({ exists: vi.fn().mockResolvedValue(false) });
      const store = new FavoritesStore(database);

      expect(await store.readMany(["1"])).toEqual([]);
      expect(await store.readIds()).toEqual([]);
      expect(await store.count()).toBe(0);
      expect(await store.hasAny()).toBe(false);
      expect(database.readMany).not.toHaveBeenCalled();
      expect(database.readAllIds).not.toHaveBeenCalled();
      expect(database.count).not.toHaveBeenCalled();
    });
  });

  describe("when the database exists", () => {
    test("readMany, readIds, and count delegate to the database", async() => {
      const database = createDatabase({
        readMany: vi.fn().mockResolvedValue(createPosts("1")),
        readAllIds: vi.fn().mockResolvedValue(["1"]),
        count: vi.fn().mockResolvedValue(3)
      });
      const store = new FavoritesStore(database);

      expect(await store.readMany(["1"])).toEqual(createPosts("1"));
      expect(await store.readIds()).toEqual(["1"]);
      expect(await store.count()).toBe(3);
    });

    test("readTags maps each post id to its tag set", async() => {
      const database = createDatabase({
        readMany: vi.fn().mockResolvedValue([createPost({ id: "1", tags: "apple banana" }), createPost({ id: "2", tags: "fox" })])
      });
      const store = new FavoritesStore(database);

      expect(await store.readTags(["1", "2"])).toEqual(new Map([
        ["1", new Set(["apple", "banana"])],
        ["2", new Set(["fox"])]
      ]));
      expect(database.readMany).toHaveBeenCalledWith(["1", "2"]);
    });

    test("hasAny is true only when the count is positive", async() => {
      const database = createDatabase({ count: vi.fn().mockResolvedValue(1) });
      const store = new FavoritesStore(database);

      expect(await store.hasAny()).toBe(true);
    });
  });

  describe("isDatabaseEmpty tracking", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    test("readAll with no records leaves the store considered empty", async() => {
      const database = createDatabase({ readAll: vi.fn().mockResolvedValue([]) });
      const store = new FavoritesStore(database);

      await store.readAll();
      store.overwrite(createPost({ id: "1" }));
      await vi.advanceTimersByTimeAsync(1_000);

      expect(database.update).not.toHaveBeenCalled();
    });

    test("readAll with records marks the store non-empty", async() => {
      const database = createDatabase({ readAll: vi.fn().mockResolvedValue(createPosts("1")) });
      const store = new FavoritesStore(database);

      await store.readAll();
      store.overwrite(createPost({ id: "2" }));
      await vi.advanceTimersByTimeAsync(1_000);

      expect(database.update).toHaveBeenCalledWith(createPosts("2"));
    });

    test("streamAll with no streamed batches leaves the store considered empty", async() => {
      const database = createDatabase({
        readAllStreamed: vi.fn().mockImplementation(async() => { })
      });
      const store = new FavoritesStore(database);

      await store.streamAll(() => { });
      store.overwrite(createPost({ id: "1" }));
      await vi.advanceTimersByTimeAsync(1_000);

      expect(database.update).not.toHaveBeenCalled();
    });

    test("streamAll with at least one batch marks the store non-empty", async() => {
      const database = createDatabase({
        readAllStreamed: vi.fn().mockImplementation((onBatch: (posts: Post[]) => void) => {
          onBatch(createPosts("1"));
        })
      });
      const store = new FavoritesStore(database);

      await store.streamAll(() => { });
      store.overwrite(createPost({ id: "2" }));
      await vi.advanceTimersByTimeAsync(1_000);

      expect(database.update).toHaveBeenCalledWith(createPosts("2"));
    });

    test("writeAll marks the store non-empty regardless of prior state", async() => {
      const database = createDatabase({ exists: vi.fn().mockResolvedValue(false) });
      const store = new FavoritesStore(database);

      await store.readAll();
      await store.writeAll(createPosts("1"));
      store.overwrite(createPost({ id: "2" }));
      await vi.advanceTimersByTimeAsync(1_000);

      expect(database.update).toHaveBeenCalledWith(createPosts("2"));
    });

    test("writeAll persists posts to the database in reverse order", async() => {
      const database = createDatabase();
      const store = new FavoritesStore(database);

      await store.writeAll(createPosts("1", "2"));

      expect(database.write).toHaveBeenCalledWith(createPosts("2", "1"));
    });

    test("overwrite before any read or write is a no-op", async() => {
      const database = createDatabase();
      const store = new FavoritesStore(database);

      store.overwrite(createPost({ id: "1" }));
      await vi.advanceTimersByTimeAsync(1_000);

      expect(database.update).not.toHaveBeenCalled();
    });
  });

  describe("delegating operations", () => {
    test("delete forwards the id to the database", async() => {
      const database = createDatabase();
      const store = new FavoritesStore(database);

      await store.delete("1");

      expect(database.delete).toHaveBeenCalledWith(["1"]);
    });

    test("exists forwards to the database", async() => {
      const database = createDatabase({ exists: vi.fn().mockResolvedValue(true) });
      const store = new FavoritesStore(database);

      expect(await store.exists()).toBe(true);
    });

    test("destroy forwards to the database", async() => {
      const database = createDatabase();
      const store = new FavoritesStore(database);

      await store.destroy();

      expect(database.destroy).toHaveBeenCalled();
    });
  });
});
