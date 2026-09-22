import { beforeEach, describe, expect, test } from "vitest";
import { FavoritesArena } from "@/features/favorites/types/favorites_arena";
import { Post } from "@/types/api";

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

    test("loads tags correctly after finalize packs the tag ids", () => {
      const first = arena.storeTags("foo bar baz");
      const second = arena.storeTags("baz qux");
      const third = arena.storeTags("foo");

      arena.compress();

      expect(arena.loadTags(first)).toBe("foo bar baz");
      expect(arena.loadTags(second)).toBe("baz qux");
      expect(arena.loadTags(third)).toBe("foo");
    });

    test("round-trips a large vocabulary through finalize", () => {
      const spans = [];

      for (let i = 0; i < 5000; i += 1) {
        spans.push(arena.storeTags(`tag-${i} shared-${i % 7}`));
      }
      arena.compress();

      for (let i = 0; i < spans.length; i += 1) {
        expect(arena.loadTags(spans[i])).toBe(`tag-${i} shared-${i % 7}`);
      }
    });

    test("stores and reads new tags after finalize by unpacking", () => {
      const before = arena.storeTags("foo bar");

      arena.compress();
      const after = arena.storeTags("baz qux");

      expect(arena.loadTags(before)).toBe("foo bar");
      expect(arena.loadTags(after)).toBe("baz qux");
    });

    test("reuses existing tag ids for tags stored after finalize", () => {
      const before = arena.storeTags("foo bar");

      arena.compress();
      const after = arena.storeTags("foo baz");

      expect(arena.loadTags(before)).toBe("foo bar");
      expect(arena.loadTags(after)).toBe("foo baz");
    });

    test("keeps a mix of pre- and post-finalize tags loadable after a second finalize", () => {
      const first = arena.storeTags("foo bar");

      expect(arena.loadTags(first)).toBe("foo bar");
      arena.compress();
      expect(arena.loadTags(first)).toBe("foo bar");
      const second = arena.storeTags("bar baz qux");

      expect(arena.loadTags(first)).toBe("foo bar");
      expect(arena.loadTags(second)).toBe("bar baz qux");
      arena.compress();

      expect(arena.loadTags(first)).toBe("foo bar");
      expect(arena.loadTags(second)).toBe("bar baz qux");
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
});

function writeId(arena: FavoritesArena, id: number): number {
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
