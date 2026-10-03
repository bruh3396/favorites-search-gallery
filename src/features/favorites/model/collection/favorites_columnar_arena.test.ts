import { beforeEach, describe, expect, test } from "vitest";
import { FavoritesColumnarArena } from "@/features/favorites/model/collection/favorites_columnar_arena";
import { createPost } from "@/testing/post";

function writeId(arena: FavoritesColumnarArena, id: number): number {
  const index = arena.allocate();

  arena.write(index, createPost({ id: String(id) }));
  return index;
}

describe("FavoritesColumnarArena", () => {
  let arena: FavoritesColumnarArena;

  beforeEach(() => {
    arena = new FavoritesColumnarArena();
  });

  describe("isEmpty", () => {
    test("is true until the first allocation", () => {
      expect(arena.isEmpty).toBe(true);
      arena.allocate();
      expect(arena.isEmpty).toBe(false);
    });
  });

  describe("allocate", () => {
    test("hands out sequential indices", () => {
      expect(arena.allocate()).toBe(0);
      expect(arena.allocate()).toBe(1);
      expect(arena.allocate()).toBe(2);
      expect(arena.favoriteCount).toBe(3);
    });

    test("grows arrays past the initial capacity while preserving data", () => {
      const beyondInitialCapacity = 1_025;

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

      arena.write(index, createPost({ id: "42", width: 100, height: 200, tags: "foo bar baz" }));

      const result = arena.toPost(index);

      expect(result.id).toBe("42");
      expect(result.width).toBe(100);
      expect(result.height).toBe(200);
      expect(result.tags).toBe("foo bar baz");
    });

    test("keeps items independent", () => {
      const first = writeId(arena, 3);
      const second = writeId(arena, 7);

      arena.write(first, createPost({ id: "3", tags: "apple" }));
      arena.write(second, createPost({ id: "7", tags: "banana cherry" }));

      expect(arena.toPost(first).tags).toBe("apple");
      expect(arena.toPost(second).tags).toBe("banana cherry");
    });
  });

  describe("media", () => {
    test("round-trips the written media", () => {
      const index = arena.allocate();

      arena.write(index, createPost({ id: "1", media: { kind: "video", locator: "12/abc123.mp4" } }));

      expect(arena.media(index)).toEqual({ kind: "video", locator: "12/abc123.mp4" });
    });

    test("ignores the tags", () => {
      const index = arena.allocate();

      arena.write(index, createPost({ id: "1", tags: "apple mp4", media: { kind: "image", locator: "12/abc123.png" } }));

      expect(arena.media(index).kind).toBe("image");
    });
  });

  describe("compress", () => {
    test("preserves item data through a compress that spans a capacity growth", () => {
      const allocatedCount = 1_029;

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

      arena.write(first, createPost({ id: "1", tags: "foo bar" }));
      arena.write(second, createPost({ id: "2", tags: "baz" }));
      arena.compress();

      expect(arena.toPost(first).tags).toBe("foo bar");
      expect(arena.toPost(second).tags).toBe("baz");
    });
  });
});
