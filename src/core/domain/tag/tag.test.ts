import { describe, expect, test } from "vitest";
import { isTagCategory, toSortedTagSet, toTagSet } from "@/core/domain/tag/tag";

describe("isTagCategory", () => {
  test("accepts every category", () => {
    for (const category of ["general", "artist", "unknown", "copyright", "character", "metadata"]) {
      expect(isTagCategory(category)).toBe(true);
    }
  });

  test("rejects raw tag types that are not categories", () => {
    expect(isTagCategory("tag")).toBe(false);
  });

  test("rejects other strings and non-strings", () => {
    expect(isTagCategory("")).toBe(false);
    expect(isTagCategory("Artist")).toBe(false);
    expect(isTagCategory(1)).toBe(false);
    expect(isTagCategory(null)).toBe(false);
  });
});

describe("toTagSet", () => {
  test("splits a space-joined string and yields an empty set for an empty string", () => {
    expect([...toTagSet("red green blue")]).toEqual(["red", "green", "blue"]);
    expect(toTagSet("").size).toBe(0);
  });
});

describe("toSortedTagSet", () => {
  test("sorts and drops empties", () => {
    expect([...toSortedTagSet("  b   a ")]).toEqual(["a", "b"]);
  });
});
