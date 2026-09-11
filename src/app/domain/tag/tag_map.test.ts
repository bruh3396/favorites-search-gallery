import { describe, expect, test } from "vitest";
import { loadTags, storeTags } from "@/app/domain/tag/tag_map";

describe("tags", () => {
  test("stores and loads a single tag", () => {
    expect(loadTags(storeTags("foo"))).toBe("foo");
  });

  test("reuses existing tag ids", () => {
    const first = storeTags("foo");
    const second = storeTags("foo");

    expect(loadTags(first)).toBe("foo");
    expect(loadTags(second)).toBe("foo");
  });

  test("stores tags for separate items", () => {
    const first = storeTags("foo");
    const second = storeTags("bar");

    expect(loadTags(first)).toBe("foo");
    expect(loadTags(second)).toBe("bar");
  });

  test("stores and loads multiple tags", () => {
    expect(loadTags(storeTags("foo bar baz"))).toBe("foo bar baz");
  });

  test("keeps spans correct with different tag counts", () => {
    const first = storeTags("foo bar");
    const second = storeTags("baz");
    const third = storeTags("qux quux corge");

    expect(loadTags(first)).toBe("foo bar");
    expect(loadTags(second)).toBe("baz");
    expect(loadTags(third)).toBe("qux quux corge");
  });

  test("stores repeated tags", () => {
    expect(loadTags(storeTags("foo bar foo"))).toBe("foo bar foo");
  });

test("promotes tag ids from Uint16 to Uint32", () => {
  for (let i = 0; i < 65536; i += 1) {
    storeTags(`tag-${i}`);
  }

  for (let i = 65536; i < 65536 + 25; i += 1) {
    const span = storeTags(`tag-${i}`);

    expect(loadTags(span)).toBe(`tag-${i}`);
  }
});
});
