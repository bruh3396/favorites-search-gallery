import { beforeEach, describe, expect, test } from "vitest";
import { FavoritesColumnarArena } from "@/features/favorites/model/collection/favorites_columnar_arena";
import { Post } from "@/types/api";

function writeId(arena: FavoritesColumnarArena, id: number): number {
  const index = arena.allocate();

  arena.write(index, post({ id: String(id) }));
  return index;
}

function post(overrides: Partial<Post>): Post {
  return {
    id: "0",
    tags: "",
    width: 0,
    height: 0,
    score: 0,
    rating: "e",
    change: 0,
    fileURL: "",
    previewURL: "",
    ...overrides
  };
}

describe("FavoritesColumnarArena", () => {
  let arena: FavoritesColumnarArena;

  beforeEach(() => {
    arena = new FavoritesColumnarArena();
  });

  describe("allocate", () => {
    test("hands out sequential indices", () => {
      expect(arena.allocate()).toBe(0);
      expect(arena.allocate()).toBe(1);
      expect(arena.allocate()).toBe(2);
      expect(arena.favoriteCount).toBe(3);
    });

    test("grows arrays past the initial capacity while preserving data", () => {
      const beyondInitialCapacity = 1025;

      for (let i = 0; i < beyondInitialCapacity; i += 1) {
        writeId(arena, i);
      }
      expect(arena.favoriteCount).toBe(beyondInitialCapacity);

      for (let i = 0; i < beyondInitialCapacity; i += 1) {
        expect(arena.id(i)).toBe(i);
      }
    });
  });

  describe("write", () => {
    test("round-trips scalar fields and tags through toPost", () => {
      const index = arena.allocate();

      arena.write(index, post({ id: "42", width: 100, height: 200, tags: "foo bar baz" }));

      const result = arena.toPost(index);

      expect(result.id).toBe("42");
      expect(result.width).toBe(100);
      expect(result.height).toBe(200);
      expect(result.tags).toBe("foo bar baz");
    });

    test("keeps items independent", () => {
      const first = writeId(arena, 3);
      const second = writeId(arena, 7);

      arena.write(first, post({ id: "3", tags: "cat" }));
      arena.write(second, post({ id: "7", tags: "dog fish" }));

      expect(arena.toPost(first).tags).toBe("cat");
      expect(arena.toPost(second).tags).toBe("dog fish");
    });
  });

  describe("compress", () => {
    test("preserves item data through a compress that spans a capacity growth", () => {
      const allocatedCount = 1029;

      for (let i = 0; i < allocatedCount; i += 1) {
        writeId(arena, i * 3);
      }
      arena.compress();

      expect(arena.favoriteCount).toBe(allocatedCount);

      for (let i = 0; i < allocatedCount; i += 1) {
        expect(arena.id(i)).toBe(i * 3);
      }
    });

    test("keeps tags loadable after compress", () => {
      const first = writeId(arena, 1);
      const second = writeId(arena, 2);

      arena.write(first, post({ id: "1", tags: "foo bar" }));
      arena.write(second, post({ id: "2", tags: "baz" }));
      arena.compress();

      expect(arena.toPost(first).tags).toBe("foo bar");
      expect(arena.toPost(second).tags).toBe("baz");
    });
  });
});
