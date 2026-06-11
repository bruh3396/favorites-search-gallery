import { convertToSortedTagString, toTagSet, toTagString } from "@/utils/string/tags";
import { describe, expect, test } from "vitest";

describe("toTagSet", () => {
  test("empty", () => {
    expect(toTagSet("")).toStrictEqual(new Set());
  });

  test("single tag", () => {
    expect(toTagSet("apple")).toStrictEqual(new Set(["apple"]));
  });

  test("multiple tags", () => {
    expect(toTagSet("apple banana cherry")).toStrictEqual(new Set(["apple", "banana", "cherry"]));
  });

  test("extra spaces", () => {
    expect(toTagSet("  apple   banana   cherry  ")).toStrictEqual(new Set(["apple", "banana", "cherry"]));
  });

  test("special characters", () => {
    expect(toTagSet("apple!@#banana$%^cherry&*()")).toStrictEqual(new Set(["apple!@#banana$%^cherry&*()"]));
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
    expect(convertToSortedTagString(new Set())).toBe("");
  });

  test("sorts unordered tags", () => {
    expect(convertToSortedTagString(new Set(["cherry", "apple", "banana"]))).toBe("apple banana cherry");
  });
});
