import { describe, expect, test } from "vitest";
import { TagPool } from "@/core/utils/collection/tag_pool";

interface Setup {
  tagPool: TagPool;
  store: (tagString: string) => number;
}

// A pool plus a store() that writes each tag string at the next free slot and returns that slot.
function setup(): Setup {
  const tagPool = new TagPool();
  let nextSlot = 0;

  function store(tagString: string): number {
    const slot = nextSlot;

    tagPool.ensureCapacity(slot + 1);
    tagPool.write(slot, tagString);
    nextSlot += 1;
    return slot;
  }
  return { tagPool, store };
}

function storeDistinctTags(store: (tagString: string) => number, count: number): void {
  for (let i = 0; i < count; i += 1) {
    store(`tag-${i}`);
  }
}

describe("TagPool", () => {
  describe("read", () => {
    test("loads a single stored tag", () => {
      const { tagPool, store } = setup();

      expect(tagPool.read(store("apple"))).toBe("apple");
    });

    test("loads multiple stored tags", () => {
      const { tagPool, store } = setup();

      expect(tagPool.read(store("apple banana cherry"))).toBe("apple banana cherry");
    });

    test("loads repeated tags", () => {
      const { tagPool, store } = setup();

      expect(tagPool.read(store("apple banana apple"))).toBe("apple banana apple");
    });
  });

  describe("write", () => {
    test("reuses existing tag ids", () => {
      const { tagPool, store } = setup();
      const first = store("apple");
      const second = store("apple");

      expect(tagPool.read(first)).toBe("apple");
      expect(tagPool.read(second)).toBe("apple");
    });

    test("stores tags for separate items", () => {
      const { tagPool, store } = setup();
      const first = store("apple");
      const second = store("banana");

      expect(tagPool.read(first)).toBe("apple");
      expect(tagPool.read(second)).toBe("banana");
    });

    test("keeps spans correct with different tag counts", () => {
      const { tagPool, store } = setup();
      const first = store("apple banana");
      const second = store("cherry");
      const third = store("date quux corge");

      expect(tagPool.read(first)).toBe("apple banana");
      expect(tagPool.read(second)).toBe("cherry");
      expect(tagPool.read(third)).toBe("date quux corge");
    });

    test("grows tag capacity past a single doubling in one store", () => {
      const { tagPool, store } = setup();
      const tagString = Array.from({ length: 5_000 }, (_, i) => `tag-${i}`).join(" ");

      expect(tagPool.read(store(tagString))).toBe(tagString);
    });

    test("promotes tag ids from Uint16 to Uint32", () => {
      const { tagPool, store } = setup();

      storeDistinctTags(store, 65_536);

      for (let i = 65_536; i < 65_536 + 25; i += 1) {
        expect(tagPool.read(store(`tag-${i}`))).toBe(`tag-${i}`);
      }
    });
  });

  describe("compact", () => {
    test("unpacks a Uint32-sized vocabulary", () => {
      const { tagPool, store } = setup();

      storeDistinctTags(store, 65_536);
      tagPool.compact();
      const slot = store("tag-65536 tag-0");

      expect(tagPool.read(0)).toBe("tag-0");
      expect(tagPool.read(65_535)).toBe("tag-65535");
      expect(tagPool.read(slot)).toBe("tag-65536 tag-0");
    });

    test("keeps tags loadable after packing the tag ids", () => {
      const { tagPool, store } = setup();
      const first = store("apple banana cherry");
      const second = store("cherry date");
      const third = store("apple");

      tagPool.compact();
      expect(tagPool.read(first)).toBe("apple banana cherry");
      expect(tagPool.read(second)).toBe("cherry date");
      expect(tagPool.read(third)).toBe("apple");
    });

    test("round-trips a large vocabulary", () => {
      const { tagPool, store } = setup();
      const indices: number[] = [];

      for (let i = 0; i < 5_000; i += 1) {
        indices.push(store(`tag-${i} shared-${i % 7}`));
      }
      tagPool.compact();

      for (let i = 0; i < indices.length; i += 1) {
        expect(tagPool.read(indices[i])).toBe(`tag-${i} shared-${i % 7}`);
      }
    });

    test("unpacks to store and read new tags afterwards", () => {
      const { tagPool, store } = setup();
      const before = store("apple banana");

      tagPool.compact();
      const after = store("cherry date");

      expect(tagPool.read(before)).toBe("apple banana");
      expect(tagPool.read(after)).toBe("cherry date");
    });

    test("reuses existing tag ids for tags stored afterwards", () => {
      const { tagPool, store } = setup();
      const before = store("apple banana");

      tagPool.compact();
      const after = store("apple cherry");

      expect(tagPool.read(before)).toBe("apple banana");
      expect(tagPool.read(after)).toBe("apple cherry");
    });

    test("keeps a mix of pre- and post-compact tags loadable after a second compact", () => {
      const { tagPool, store } = setup();
      const first = store("apple banana");

      expect(tagPool.read(first)).toBe("apple banana");
      tagPool.compact();
      expect(tagPool.read(first)).toBe("apple banana");
      const second = store("banana cherry date");

      expect(tagPool.read(first)).toBe("apple banana");
      expect(tagPool.read(second)).toBe("banana cherry date");
      tagPool.compact();
      expect(tagPool.read(first)).toBe("apple banana");
      expect(tagPool.read(second)).toBe("banana cherry date");
    });
  });

  describe("trim", () => {
    test("keeps stored tags readable when trimming to the stored count", () => {
      const { tagPool, store } = setup();
      const first = store("apple banana");
      const second = store("cherry");

      tagPool.trim(2);
      expect(tagPool.read(first)).toBe("apple banana");
      expect(tagPool.read(second)).toBe("cherry");
    });

    test("grows again afterwards", () => {
      const { tagPool, store } = setup();
      const first = store("apple");

      tagPool.trim(1);
      const second = store("banana");

      expect(tagPool.read(first)).toBe("apple");
      expect(tagPool.read(second)).toBe("banana");
    });

    test("keeps stored tags readable when trimming to the current capacity", () => {
      const { tagPool, store } = setup();
      const first = store("apple");

      tagPool.trim(1_024);
      expect(tagPool.read(first)).toBe("apple");
    });
  });
});
