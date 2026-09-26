import { beforeEach, describe, expect, test } from "vitest";
import { TagPool } from "@/lib/collection/tag_pool";

describe("TagPool", () => {
  let tagPool: TagPool;
  let nextIndex: number;

  beforeEach(() => {
    tagPool = new TagPool();
    nextIndex = 0;
  });

  function store(pool: TagPool, tagString: string): number {
    const index = nextIndex;

    pool.ensureCapacity(index + 1);
    pool.write(index, tagString);
    nextIndex += 1;
    return index;
  }

  test("stores and loads a single tag", () => {
    expect(tagPool.read(store(tagPool, "foo"))).toBe("foo");
  });

  test("reuses existing tag ids", () => {
    const first = store(tagPool, "foo");
    const second = store(tagPool, "foo");

    expect(tagPool.read(first)).toBe("foo");
    expect(tagPool.read(second)).toBe("foo");
  });

  test("stores tags for separate items", () => {
    const first = store(tagPool, "foo");
    const second = store(tagPool, "bar");

    expect(tagPool.read(first)).toBe("foo");
    expect(tagPool.read(second)).toBe("bar");
  });

  test("stores and loads multiple tags", () => {
    expect(tagPool.read(store(tagPool, "foo bar baz"))).toBe("foo bar baz");
  });

  test("keeps spans correct with different tag counts", () => {
    const first = store(tagPool, "foo bar");
    const second = store(tagPool, "baz");
    const third = store(tagPool, "qux quux corge");

    expect(tagPool.read(first)).toBe("foo bar");
    expect(tagPool.read(second)).toBe("baz");
    expect(tagPool.read(third)).toBe("qux quux corge");
  });

  test("stores repeated tags", () => {
    expect(tagPool.read(store(tagPool, "foo bar foo"))).toBe("foo bar foo");
  });

  test("grows tag capacity past a single doubling in one store", () => {
    const tagString = Array.from({ length: 5000 }, (_, i) => `tag-${i}`).join(" ");

    expect(tagPool.read(store(tagPool, tagString))).toBe(tagString);
  });

  test("promotes tag ids from Uint16 to Uint32", () => {
    for (let i = 0; i < 65536; i += 1) {
      store(tagPool, `tag-${i}`);
    }

    for (let i = 65536; i < 65536 + 25; i += 1) {
      const index = store(tagPool, `tag-${i}`);

      expect(tagPool.read(index)).toBe(`tag-${i}`);
    }
  });

  test("loads tags correctly after compress packs the tag ids", () => {
    const first = store(tagPool, "foo bar baz");
    const second = store(tagPool, "baz qux");
    const third = store(tagPool, "foo");

    tagPool.compress();

    expect(tagPool.read(first)).toBe("foo bar baz");
    expect(tagPool.read(second)).toBe("baz qux");
    expect(tagPool.read(third)).toBe("foo");
  });

  test("round-trips a large vocabulary through compress", () => {
    const indices = [];

    for (let i = 0; i < 5000; i += 1) {
      indices.push(store(tagPool, `tag-${i} shared-${i % 7}`));
    }
    tagPool.compress();

    for (let i = 0; i < indices.length; i += 1) {
      expect(tagPool.read(indices[i])).toBe(`tag-${i} shared-${i % 7}`);
    }
  });

  test("stores and reads new tags after compress by unpacking", () => {
    const before = store(tagPool, "foo bar");

    tagPool.compress();
    const after = store(tagPool, "baz qux");

    expect(tagPool.read(before)).toBe("foo bar");
    expect(tagPool.read(after)).toBe("baz qux");
  });

  test("reuses existing tag ids for tags stored after compress", () => {
    const before = store(tagPool, "foo bar");

    tagPool.compress();
    const after = store(tagPool, "foo baz");

    expect(tagPool.read(before)).toBe("foo bar");
    expect(tagPool.read(after)).toBe("foo baz");
  });

  test("keeps a mix of pre- and post-compress tags loadable after a second compress", () => {
    const first = store(tagPool, "foo bar");

    expect(tagPool.read(first)).toBe("foo bar");
    tagPool.compress();
    expect(tagPool.read(first)).toBe("foo bar");
    const second = store(tagPool, "bar baz qux");

    expect(tagPool.read(first)).toBe("foo bar");
    expect(tagPool.read(second)).toBe("bar baz qux");
    tagPool.compress();

    expect(tagPool.read(first)).toBe("foo bar");
    expect(tagPool.read(second)).toBe("bar baz qux");
  });
});
