import { beforeEach, describe, expect, test } from "vitest";
import { FavoritesArena } from "@/features/favorites/types/favorites_arena";

describe("FavoriteArena", () => {
  let arena: FavoritesArena;

  beforeEach(() => {
    arena = new FavoritesArena();
  });

  describe("tags", () => {
    test("stores and loads a single tag", () => {
      expect(arena.loadTags(arena.storeTags("foo"))).toBe("foo");
    });

    test("reuses existing tag ids", () => {
      const first = arena.storeTags("foo");
      const second = arena.storeTags("foo");

      expect(arena.loadTags(first)).toBe("foo");
      expect(arena.loadTags(second)).toBe("foo");
    });

    test("stores tags for separate items", () => {
      const first = arena.storeTags("foo");
      const second = arena.storeTags("bar");

      expect(arena.loadTags(first)).toBe("foo");
      expect(arena.loadTags(second)).toBe("bar");
    });

    test("stores and loads multiple tags", () => {
      expect(arena.loadTags(arena.storeTags("foo bar baz"))).toBe("foo bar baz");
    });

    test("keeps spans correct with different tag counts", () => {
      const first = arena.storeTags("foo bar");
      const second = arena.storeTags("baz");
      const third = arena.storeTags("qux quux corge");

      expect(arena.loadTags(first)).toBe("foo bar");
      expect(arena.loadTags(second)).toBe("baz");
      expect(arena.loadTags(third)).toBe("qux quux corge");
    });

    test("stores repeated tags", () => {
      expect(arena.loadTags(arena.storeTags("foo bar foo"))).toBe("foo bar foo");
    });

    test("grows tag capacity past a single doubling in one store", () => {
      const tagString = Array.from({ length: 5000 }, (_, i) => `tag-${i}`).join(" ");

      expect(arena.loadTags(arena.storeTags(tagString))).toBe(tagString);
    });

    test("promotes tag ids from Uint16 to Uint32", () => {
      for (let i = 0; i < 65536; i += 1) {
        arena.storeTags(`tag-${i}`);
      }

      for (let i = 65536; i < 65536 + 25; i += 1) {
        const span = arena.storeTags(`tag-${i}`);

        expect(arena.loadTags(span)).toBe(`tag-${i}`);
      }
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
      const initialCapacity = arena.ids.length;

      for (let i = 0; i <= initialCapacity; i += 1) {
        const index = arena.allocate();

        arena.ids[index] = i;
      }
      expect(arena.ids.length).toBeGreaterThan(initialCapacity);

      for (let i = 0; i <= initialCapacity; i += 1) {
        expect(arena.ids[i]).toBe(i);
      }
    });
  });
});
