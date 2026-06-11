import { convertToTagSet, convertToTagString } from "@/utils/string/tags";
import { describe, expect, test } from "vitest";

describe("convertToTagSet", () => {
  test("empty", () => {
    expect(convertToTagSet("")).toStrictEqual(new Set());
  });

  test("single tag", () => {
    expect(convertToTagSet("apple")).toStrictEqual(new Set(["apple"]));
  });

  test("multiple tags", () => {
    expect(convertToTagSet("apple banana cherry")).toStrictEqual(new Set(["apple", "banana", "cherry"]));
  });

  test("extra spaces", () => {
    expect(convertToTagSet("  apple   banana   cherry  ")).toStrictEqual(new Set(["apple", "banana", "cherry"]));
  });

  test("special characters", () => {
    expect(convertToTagSet("apple!@#banana$%^cherry&*()")).toStrictEqual(new Set(["apple!@#banana$%^cherry&*()"]));
  });
});

describe("convertToTagString", () => {
  test("empty", () => {
    expect(convertToTagString(new Set())).toBe("");
  });

  test("single tag", () => {
    expect(convertToTagString(new Set(["apple"]))).toBe("apple");
  });

  test("multiple tags", () => {
    expect(convertToTagString(new Set(["apple", "banana", "cherry"]))).toBe("apple banana cherry");
  });

  test("special characters", () => {
    expect(convertToTagString(new Set(["apple!@#banana$%^cherry&*()"]))).toBe("apple!@#banana$%^cherry&*()");
  });
});
