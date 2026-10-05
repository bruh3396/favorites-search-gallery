import { describe, expect, test } from "vitest";
import { TagPool } from "@/core/utils/collection/tag_pool";

interface Setup {
  tagPool: TagPool;
  store: (tagString: string) => number;
}

// A pool plus a store() that writes each tag string at the next free index and returns that index.
function setup(): Setup {
  const tagPool = new TagPool();
  let nextIndex = 0;

  function store(tagString: string): number {
    const index = nextIndex;

    tagPool.ensureCapacity(index + 1);
    tagPool.write(index, tagString);
    nextIndex += 1;
    return index;
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

      expect(tagPool.read(store("foo"))).toBe("foo");
    });

    test("loads multiple stored tags", () => {
      const { tagPool, store } = setup();

      expect(tagPool.read(store("foo bar baz"))).toBe("foo bar baz");
    });

    test("loads repeated tags", () => {
      const { tagPool, store } = setup();

      expect(tagPool.read(store("foo bar foo"))).toBe("foo bar foo");
    });
  });

  describe("write", () => {
    test("reuses existing tag ids", () => {
      const { tagPool, store } = setup();
      const first = store("foo");
      const second = store("foo");

      expect(tagPool.read(first)).toBe("foo");
      expect(tagPool.read(second)).toBe("foo");
    });

    test("stores tags for separate items", () => {
      const { tagPool, store } = setup();
      const first = store("foo");
      const second = store("bar");

      expect(tagPool.read(first)).toBe("foo");
      expect(tagPool.read(second)).toBe("bar");
    });

    test("keeps spans correct with different tag counts", () => {
      const { tagPool, store } = setup();
      const first = store("foo bar");
      const second = store("baz");
      const third = store("qux quux corge");

      expect(tagPool.read(first)).toBe("foo bar");
      expect(tagPool.read(second)).toBe("baz");
      expect(tagPool.read(third)).toBe("qux quux corge");
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

  describe("compress", () => {
    test("unpacks a Uint32-sized vocabulary", () => {
      const { tagPool, store } = setup();

      storeDistinctTags(store, 65_536);
      tagPool.compress();
      const index = store("tag-65536 tag-0");

      expect(tagPool.read(0)).toBe("tag-0");
      expect(tagPool.read(65_535)).toBe("tag-65535");
      expect(tagPool.read(index)).toBe("tag-65536 tag-0");
    });

    test("keeps tags loadable after packing the tag ids", () => {
      const { tagPool, store } = setup();
      const first = store("foo bar baz");
      const second = store("baz qux");
      const third = store("foo");

      tagPool.compress();
      expect(tagPool.read(first)).toBe("foo bar baz");
      expect(tagPool.read(second)).toBe("baz qux");
      expect(tagPool.read(third)).toBe("foo");
    });

    test("round-trips a large vocabulary", () => {
      const { tagPool, store } = setup();
      const indices: number[] = [];

      for (let i = 0; i < 5_000; i += 1) {
        indices.push(store(`tag-${i} shared-${i % 7}`));
      }
      tagPool.compress();

      for (let i = 0; i < indices.length; i += 1) {
        expect(tagPool.read(indices[i])).toBe(`tag-${i} shared-${i % 7}`);
      }
    });

    test("unpacks to store and read new tags afterwards", () => {
      const { tagPool, store } = setup();
      const before = store("foo bar");

      tagPool.compress();
      const after = store("baz qux");

      expect(tagPool.read(before)).toBe("foo bar");
      expect(tagPool.read(after)).toBe("baz qux");
    });

    test("reuses existing tag ids for tags stored afterwards", () => {
      const { tagPool, store } = setup();
      const before = store("foo bar");

      tagPool.compress();
      const after = store("foo baz");

      expect(tagPool.read(before)).toBe("foo bar");
      expect(tagPool.read(after)).toBe("foo baz");
    });

    test("keeps a mix of pre- and post-compress tags loadable after a second compress", () => {
      const { tagPool, store } = setup();
      const first = store("foo bar");

      expect(tagPool.read(first)).toBe("foo bar");
      tagPool.compress();
      expect(tagPool.read(first)).toBe("foo bar");
      const second = store("bar baz qux");

      expect(tagPool.read(first)).toBe("foo bar");
      expect(tagPool.read(second)).toBe("bar baz qux");
      tagPool.compress();
      expect(tagPool.read(first)).toBe("foo bar");
      expect(tagPool.read(second)).toBe("bar baz qux");
    });
  });

  describe("trim", () => {
    test("keeps stored tags readable when trimming to the stored count", () => {
      const { tagPool, store } = setup();
      const first = store("foo bar");
      const second = store("baz");

      tagPool.trim(2);
      expect(tagPool.read(first)).toBe("foo bar");
      expect(tagPool.read(second)).toBe("baz");
    });

    test("grows again afterwards", () => {
      const { tagPool, store } = setup();
      const first = store("foo");

      tagPool.trim(1);
      const second = store("bar");

      expect(tagPool.read(first)).toBe("foo");
      expect(tagPool.read(second)).toBe("bar");
    });

    test("keeps stored tags readable when trimming to the current capacity", () => {
      const { tagPool, store } = setup();
      const first = store("foo");

      tagPool.trim(1_024);
      expect(tagPool.read(first)).toBe("foo");
    });
  });
});
