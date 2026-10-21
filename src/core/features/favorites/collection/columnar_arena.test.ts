import { describe, expect, test } from "vitest";
import { FavoritesColumnarArena } from "@/core/features/favorites/collection/columnar_arena";
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
  });

  describe("write", () => {
    test("grows storage when writing beyond the initial capacity", () => {
      const arena = new FavoritesColumnarArena();
      let slot = -1;

      for (let i = 0; i < 1_025; i += 1) {
        slot = arena.allocate();
      }
      const post = createPost({ id: "1025", tags: "apple banana" });

      arena.write(slot, post);
      expect(arena.getPost(slot)).toEqual(post);
    });

    test("replaces the tags of a rewritten slot", () => {
      const { arena, slot } = setup("apple");

      arena.write(slot, createPost({ id: "1", tags: "banana" }));
      expect(arena.getTags(slot)).toEqual(new Set(["banana"]));
    });
  });

  describe("compact", () => {
    test("keeps the data readable", () => {
      const { arena, slot } = setup("apple banana");

      arena.compact();
      expect(arena.getTags(slot)).toEqual(new Set(["apple", "banana"]));
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
