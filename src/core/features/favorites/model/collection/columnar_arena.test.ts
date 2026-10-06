import { describe, expect, test } from "vitest";
import { FavoritesColumnarArena } from "@/core/features/favorites/model/collection/columnar_arena";
import { createPost } from "@/testing/post";

function setup(tags: string): { arena: FavoritesColumnarArena; slot: number } {
  const arena = new FavoritesColumnarArena();
  const slot = arena.allocate();

  arena.write(slot, createPost({ id: "1", tags }));
  return { arena, slot };
}

describe("FavoritesColumnarArena", () => {
  describe("allocate", () => {
    test("hands out consecutive indexes", () => {
      const arena = new FavoritesColumnarArena();

      expect([arena.allocate(), arena.allocate(), arena.allocate()]).toEqual([0, 1, 2]);
    });
  });

  describe("getPost", () => {
    test("reads back the written post", () => {
      const arena = new FavoritesColumnarArena();
      const slot = arena.allocate();
      const post = createPost({ id: "1", tags: "apple banana", score: 5 });

      arena.write(slot, post);
      expect(arena.getPost(slot)).toEqual(post);
    });
  });

  describe("getTags", () => {
    test("parses the written tags", () => {
      const { arena, slot } = setup("apple banana");

      expect(arena.getTags(slot)).toEqual(new Set(["apple", "banana"]));
    });

    test("returns the cached set while it is cached", () => {
      const { arena, slot } = setup("apple");
      const cached = new Set(["apple"]);

      arena.cacheTags(slot, cached);
      expect(arena.getTags(slot)).toBe(cached);
    });
  });

  describe("write", () => {
    test("drops the cached tags so they cannot go stale", () => {
      const { arena, slot } = setup("apple");

      arena.cacheTags(slot, new Set(["apple"]));
      arena.write(slot, createPost({ id: "1", tags: "banana" }));
      expect(arena.getTags(slot)).toEqual(new Set(["banana"]));
    });
  });

  describe("clearTagCache", () => {
    test("drops every cached set and keeps the tags readable", () => {
      const { arena, slot } = setup("apple");
      const cached = new Set(["apple"]);

      arena.cacheTags(slot, cached);
      arena.clearTagCache();
      expect(arena.getTags(slot)).not.toBe(cached);
      expect(arena.getTags(slot)).toEqual(cached);
    });
  });

  describe("compact", () => {
    test("drops every cached set and keeps the data readable", () => {
      const { arena, slot } = setup("apple banana");
      const cached = new Set(["apple", "banana"]);

      arena.cacheTags(slot, cached);
      arena.compact();
      expect(arena.getTags(slot)).not.toBe(cached);
      expect(arena.getTags(slot)).toEqual(cached);
      expect(arena.getNumericId(slot)).toBe(1);
    });
  });

  describe("markNew", () => {
    test("marks the favorite as new", () => {
      const { arena, slot } = setup("apple");

      arena.markNew(slot);
      expect(arena.isNew(slot)).toBe(true);
    });
  });
});
