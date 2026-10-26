import { describe, expect, test } from "vitest";
import { TagPool } from "@/core/features/favorites/collection/tag_pool";
import { StringInterner } from "@/core/utils/string/string_interner";

interface Setup {
  tagPool: TagPool;
  store: (tagNames: readonly string[]) => number;
}

function setup(): Setup {
  const tagPool = new TagPool(new StringInterner());
  let nextSlot = 0;

  function store(tagNames: readonly string[]): number {
    const slot = nextSlot;

    tagPool.write(slot, tagNames);
    nextSlot += 1;
    return slot;
  }
  return { tagPool, store };
}

function storeDistinctTags(store: (tagNames: readonly string[]) => number, count: number): void {
  for (let i = 0; i < count; i += 1) {
    store([`tag-${i}`]);
  }
}

describe("TagPool", () => {
  describe("read", () => {
    test("loads a single stored tag", () => {
      const { tagPool, store } = setup();

      expect(tagPool.read(store(["apple"]))).toEqual(["apple"]);
    });

    test("loads multiple stored tags", () => {
      const { tagPool, store } = setup();

      expect(tagPool.read(store(["apple", "banana", "cherry"]))).toEqual(["apple", "banana", "cherry"]);
    });

    test("loads repeated tags", () => {
      const { tagPool, store } = setup();

      expect(tagPool.read(store(["apple", "banana", "apple"]))).toEqual(["apple", "banana", "apple"]);
    });
  });

  describe("write", () => {
    test("reuses existing tag ids", () => {
      const { tagPool, store } = setup();
      const first = store(["apple"]);
      const second = store(["apple"]);

      expect(tagPool.read(first)).toEqual(["apple"]);
      expect(tagPool.read(second)).toEqual(["apple"]);
    });

    test("stores tags for separate items", () => {
      const { tagPool, store } = setup();
      const first = store(["apple"]);
      const second = store(["banana"]);

      expect(tagPool.read(first)).toEqual(["apple"]);
      expect(tagPool.read(second)).toEqual(["banana"]);
    });

    test("grows slot capacity when writing beyond the initial capacity", () => {
      const { tagPool, store } = setup();
      let slot = -1;

      for (let i = 0; i < 1_025; i += 1) {
        slot = store([`tag-${i}`]);
      }
      expect(tagPool.read(slot)).toEqual(["tag-1024"]);
    });

    test("keeps spans correct with different tag counts", () => {
      const { tagPool, store } = setup();
      const first = store(["apple", "banana"]);
      const second = store(["cherry"]);
      const third = store(["date", "quux", "corge"]);

      expect(tagPool.read(first)).toEqual(["apple", "banana"]);
      expect(tagPool.read(second)).toEqual(["cherry"]);
      expect(tagPool.read(third)).toEqual(["date", "quux", "corge"]);
    });

    test("grows tag capacity past a single doubling in one store", () => {
      const { tagPool, store } = setup();
      const tagNames = Array.from({ length: 5_000 }, (_, i) => `tag-${i}`);

      expect(tagPool.read(store(tagNames))).toEqual(tagNames);
    });

    test("promotes tag ids from Uint16 to Uint32", () => {
      const { tagPool, store } = setup();

      storeDistinctTags(store, 65_536);

      for (let i = 65_536; i < 65_536 + 25; i += 1) {
        expect(tagPool.read(store([`tag-${i}`]))).toEqual([`tag-${i}`]);
      }
    });
  });

  describe("compact", () => {
    test("unpacks a Uint32-sized vocabulary", () => {
      const { tagPool, store } = setup();

      storeDistinctTags(store, 65_536);
      tagPool.compact();
      const slot = store(["tag-65536", "tag-0"]);

      expect(tagPool.read(0)).toEqual(["tag-0"]);
      expect(tagPool.read(65_535)).toEqual(["tag-65535"]);
      expect(tagPool.read(slot)).toEqual(["tag-65536", "tag-0"]);
    });

    test("keeps tags loadable after packing the tag ids", () => {
      const { tagPool, store } = setup();
      const first = store(["apple", "banana", "cherry"]);
      const second = store(["cherry", "date"]);
      const third = store(["apple"]);

      tagPool.compact();
      expect(tagPool.read(first)).toEqual(["apple", "banana", "cherry"]);
      expect(tagPool.read(second)).toEqual(["cherry", "date"]);
      expect(tagPool.read(third)).toEqual(["apple"]);
    });

    test.each([1, 2, 3, 255, 256, 257, 4_097])("round-trips every tag of a %i-tag vocabulary", vocabularySize => {
      const { tagPool, store } = setup();
      const tagNames = Array.from({ length: vocabularySize }, (_, i) => `tag-${i}`);
      const slots = tagNames.map(tagName => store([tagName]));
      const mixed = store(tagNames.toReversed().slice(0, 9));

      tagPool.compact();
      expect(slots.map(slot => tagPool.read(slot)[0])).toEqual(tagNames);
      expect(tagPool.read(mixed)).toEqual(tagNames.toReversed().slice(0, 9));
    });

    test("round-trips a large vocabulary", () => {
      const { tagPool, store } = setup();
      const indices: number[] = [];

      for (let i = 0; i < 5_000; i += 1) {
        indices.push(store([`tag-${i}`, `shared-${i % 7}`]));
      }
      tagPool.compact();

      for (let i = 0; i < indices.length; i += 1) {
        expect(tagPool.read(indices[i])).toEqual([`tag-${i}`, `shared-${i % 7}`]);
      }
    });

    test("unpacks to store and read new tags afterwards", () => {
      const { tagPool, store } = setup();
      const before = store(["apple", "banana"]);

      tagPool.compact();
      const after = store(["cherry", "date"]);

      expect(tagPool.read(before)).toEqual(["apple", "banana"]);
      expect(tagPool.read(after)).toEqual(["cherry", "date"]);
    });

    test("reuses existing tag ids for tags stored afterwards", () => {
      const { tagPool, store } = setup();
      const before = store(["apple", "banana"]);

      tagPool.compact();
      const after = store(["apple", "cherry"]);

      expect(tagPool.read(before)).toEqual(["apple", "banana"]);
      expect(tagPool.read(after)).toEqual(["apple", "cherry"]);
    });

    test("keeps a mix of pre- and post-compact tags loadable after a second compact", () => {
      const { tagPool, store } = setup();
      const first = store(["apple", "banana"]);

      expect(tagPool.read(first)).toEqual(["apple", "banana"]);
      tagPool.compact();
      expect(tagPool.read(first)).toEqual(["apple", "banana"]);
      const second = store(["banana", "cherry", "date"]);

      expect(tagPool.read(first)).toEqual(["apple", "banana"]);
      expect(tagPool.read(second)).toEqual(["banana", "cherry", "date"]);
      tagPool.compact();
      expect(tagPool.read(first)).toEqual(["apple", "banana"]);
      expect(tagPool.read(second)).toEqual(["banana", "cherry", "date"]);
    });
  });

  describe("trim", () => {
    test("keeps stored tags readable when trimming to the stored count", () => {
      const { tagPool, store } = setup();
      const first = store(["apple", "banana"]);
      const second = store(["cherry"]);

      tagPool.trim(2);
      expect(tagPool.read(first)).toEqual(["apple", "banana"]);
      expect(tagPool.read(second)).toEqual(["cherry"]);
    });

    test("grows again afterwards", () => {
      const { tagPool, store } = setup();
      const first = store(["apple"]);

      tagPool.trim(1);
      const second = store(["banana"]);

      expect(tagPool.read(first)).toEqual(["apple"]);
      expect(tagPool.read(second)).toEqual(["banana"]);
    });

    test("keeps stored tags readable when trimming to the current capacity", () => {
      const { tagPool, store } = setup();
      const first = store(["apple"]);

      tagPool.trim(1_024);
      expect(tagPool.read(first)).toEqual(["apple"]);
    });
  });
});
