import { describe, expect, test } from "vitest";
import { negateTags, toSortedTagArray, toSortedTagSet, toSortedTagString, toTagSet, toTagString } from "@/utils/pure/tag";

describe("toTagSet", () => {
  test("splits a space-joined string and yields an empty set for an empty string", () => {
    expect([...toTagSet("red green blue")]).toEqual(["red", "green", "blue"]);
    expect(toTagSet("").size).toBe(0);
  });
});

describe("toSortedTagArray", () => {
  test("sorts, dedupes, and drops empties", () => {
    expect(toSortedTagArray("cherry banana apple cherry")).toEqual(["apple", "banana", "cherry"]);
  });
});

describe("toSortedTagSet", () => {
  test("sorts and drops empties", () => {
    expect([...toSortedTagSet("  b   a ")]).toEqual(["a", "b"]);
  });
});

describe("toTagString", () => {
  test("returns an empty string for no tags", () => {
    expect(toTagString(new Set())).toBe("");
  });

  test("returns a single tag", () => {
    expect(toTagString(new Set(["apple"]))).toBe("apple");
  });

  test("joins multiple tags with spaces", () => {
    expect(toTagString(new Set(["apple", "banana", "cherry"]))).toBe("apple banana cherry");
  });

  test("keeps special characters", () => {
    expect(toTagString(new Set(["apple!@#banana$%^cherry&*()"]))).toBe("apple!@#banana$%^cherry&*()");
  });

  test("preserves insertion order without sorting", () => {
    expect(toTagString(new Set(["cherry", "apple", "banana"]))).toBe("cherry apple banana");
  });
});

describe("toSortedTagString", () => {
  test("returns an empty string for no tags", () => {
    expect(toSortedTagString(new Set())).toBe("");
  });

  test("sorts unordered tags", () => {
    expect(toSortedTagString(new Set(["cherry", "apple", "banana"]))).toBe("apple banana cherry");
  });
});

describe("negateTags", () => {
  test("keeps an empty string", () => {
    expect(negateTags("")).toBe("");
  });

  test("prefixes every tag with a dash", () => {
    expect(negateTags("apple")).toBe("-apple");
    expect(negateTags("apple   ")).toBe("-apple   ");
    expect(negateTags("apple banana")).toBe("-apple -banana");
    expect(negateTags("apple banana cherry")).toBe("-apple -banana -cherry");
  });
});
