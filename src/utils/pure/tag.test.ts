import { describe, expect, test } from "vitest";
import { internTag, internTags, negateTags, toSortedTagArray, toSortedTagSet, toTagSet, toSortedTagString, toTagString } from "@/utils/pure/tag";

describe("internTag", () => {
  test("returns the same string reference for equal tags", () => {
    const a = internTag("apple".split("").join(""));
    const b = internTag("apple".split("").join(""));

    expect(a).toBe("apple");
    expect(a).toBe(b);
  });
});

describe("internTags", () => {
  test("dedupes and drops empty strings", () => {
    expect(internTags(["dup", "dup", "", "other"])).toEqual(["dup", "other"]);
  });
});

describe("toTagSet", () => {
  test("splits a space-joined string, empty yields empty set", () => {
    expect([...toTagSet("red green blue")]).toEqual(["red", "green", "blue"]);
    expect(toTagSet("").size).toBe(0);
  });
});

describe("toSortedTagSet / toSortedTagArray", () => {
  test("sorts, dedupes, and drops empties", () => {
    expect(toSortedTagArray("cherry banana apple cherry")).toEqual(["apple", "banana", "cherry"]);
    expect([...toSortedTagSet("  b   a ")]).toEqual(["a", "b"]);
  });
});

describe("toTagString", () => {
  test("empty", () => {
    expect(toTagString(new Set())).toBe("");
  });

  test("single tag", () => {
    expect(toTagString(new Set(["apple"]))).toBe("apple");
  });

  test("multiple tags", () => {
    expect(toTagString(new Set(["apple", "banana", "cherry"]))).toBe("apple banana cherry");
  });

  test("special characters", () => {
    expect(toTagString(new Set(["apple!@#banana$%^cherry&*()"]))).toBe("apple!@#banana$%^cherry&*()");
  });

  test("preserves insertion order without sorting", () => {
    expect(toTagString(new Set(["cherry", "apple", "banana"]))).toBe("cherry apple banana");
  });
});

describe("toSortedTagString", () => {
  test("empty", () => {
    expect(toSortedTagString(new Set())).toBe("");
  });

  test("sorts unordered tags", () => {
    expect(toSortedTagString(new Set(["cherry", "apple", "banana"]))).toBe("apple banana cherry");
  });
});

describe("negateTags", () => {
  test("empty", () => {
    expect(negateTags("")).toBe("");
  });

  test("negate", () => {
    expect(negateTags("apple")).toBe("-apple");
    expect(negateTags("apple   ")).toBe("-apple   ");
    expect(negateTags("apple banana")).toBe("-apple -banana");
    expect(negateTags("apple banana cherry")).toBe("-apple -banana -cherry");
  });
});
