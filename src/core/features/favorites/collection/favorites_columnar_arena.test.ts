import { describe, expect, test } from "vitest";
import { FavoritesColumnarArena } from "@/core/features/favorites/collection/favorites_columnar_arena";
import { createPost } from "@/testing/post";
import { StringInterner } from "@/core/utils/string/string_interner";

function setup(tags: string): { favoritesColumnarArena: FavoritesColumnarArena; slot: number } {
  const favoritesColumnarArena = new FavoritesColumnarArena(new StringInterner());
  const slot = favoritesColumnarArena.allocate();

  favoritesColumnarArena.write(slot, createPost({ id: "1", tags }));
  return { favoritesColumnarArena, slot };
}

describe("FavoritesColumnarArena", () => {
  describe("allocate", () => {
    test("hands out consecutive indexes", () => {
      const favoritesColumnarArena = new FavoritesColumnarArena(new StringInterner());

      expect([favoritesColumnarArena.allocate(), favoritesColumnarArena.allocate(), favoritesColumnarArena.allocate()]).toEqual([0, 1, 2]);
    });
  });

  describe("getPost", () => {
    test("reads back the written post", () => {
      const favoritesColumnarArena = new FavoritesColumnarArena(new StringInterner());
      const slot = favoritesColumnarArena.allocate();
      const post = createPost({ id: "1", tags: "apple banana", score: 5 });

      favoritesColumnarArena.write(slot, post);
      expect(favoritesColumnarArena.getPost(slot)).toEqual(post);
    });
  });

  describe("getTags", () => {
    test("parses the written tags", () => {
      const { favoritesColumnarArena, slot } = setup("apple banana");

      expect(favoritesColumnarArena.getTags(slot)).toEqual(new Set(["apple", "banana"]));
    });

    test("returns no tags for a post without tags", () => {
      const { favoritesColumnarArena, slot } = setup("");

      expect(favoritesColumnarArena.getTags(slot).size).toBe(0);
    });
  });

  describe("write", () => {
    test("grows storage when writing beyond the initial capacity", () => {
      const favoritesColumnarArena = new FavoritesColumnarArena(new StringInterner());
      let slot = -1;

      for (let i = 0; i < 1_025; i += 1) {
        slot = favoritesColumnarArena.allocate();
      }
      const post = createPost({ id: "1025", tags: "apple banana" });

      favoritesColumnarArena.write(slot, post);
      expect(favoritesColumnarArena.getPost(slot)).toEqual(post);
    });

    test("replaces the tags of a rewritten slot", () => {
      const { favoritesColumnarArena, slot } = setup("apple");

      favoritesColumnarArena.write(slot, createPost({ id: "1", tags: "banana" }));
      expect(favoritesColumnarArena.getTags(slot)).toEqual(new Set(["banana"]));
    });
  });

  describe("compact", () => {
    test("keeps the data readable", () => {
      const { favoritesColumnarArena, slot } = setup("apple banana");

      favoritesColumnarArena.compact();
      expect(favoritesColumnarArena.getTags(slot)).toEqual(new Set(["apple", "banana"]));
      expect(favoritesColumnarArena.getNumericId(slot)).toBe(1);
    });
  });

  describe("markNew", () => {
    test("marks the favorite as new", () => {
      const { favoritesColumnarArena, slot } = setup("apple");

      favoritesColumnarArena.markNew(slot);
      expect(favoritesColumnarArena.isNew(slot)).toBe(true);
    });
  });
});
