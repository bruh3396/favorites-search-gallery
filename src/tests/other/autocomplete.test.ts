import { describe, expect, test } from "vitest";
import { getTagBoundary, replaceTag } from "../../features/autocomplete/autocomplete_tag_replacer";

describe("getWordBoundaries", () => {
  test("empty", () => {
    expect(getTagBoundary("", 0)).toEqual({ start: 0, end: 0 });
  });

  test("index out of bounds", () => {
    expect(getTagBoundary("", 1)).toEqual({ start: 0, end: 0 });
    expect(getTagBoundary("", -1)).toEqual({ start: 0, end: 0 });
  });

  test.each([
    ["hello world", -1, { start: 0, end: 0 }],
    ["hello world", 0, { start: 0, end: 5 }],
    ["hello world", 1, { start: 0, end: 5 }],
    ["hello world", 2, { start: 0, end: 5 }],
    ["hello world", 3, { start: 0, end: 5 }],
    ["hello world", 4, { start: 0, end: 5 }],
    ["hello world", 5, { start: 0, end: 5 }],
    ["hello world", 6, { start: 6, end: 11 }],
    ["hello world", 7, { start: 6, end: 11 }],
    ["hello world", 8, { start: 6, end: 11 }],
    ["hello world", 9, { start: 6, end: 11 }],
    ["hello world", 10, { start: 6, end: 11 }],
    ["hello world", 11, { start: 6, end: 11 }],
    ["hello world", 12, { start: 0, end: 0 }],
    ["hello there world", 6, { start: 6, end: 11 }]
  ])("getTagBoundary(%s, %i)", (text, index, expected) => {
    expect(getTagBoundary(text, index)).toEqual(expected);
  });

  test.each([
    ["hello -world", 9, { start: 7, end: 12 }],
    ["hello -world", 8, { start: 7, end: 12 }]
  ])("negated getTagBoundary(%s, %i)", (text, index, expected) => {
    expect(getTagBoundary(text, index)).toEqual(expected);
  });

  test("cursor not on word", () => {
    expect(getTagBoundary("hello  world", 6)).toEqual({ start: 6, end: 6 });
  });
});

describe("replaceTag", () => {
  test("empty", () => {
    expect(replaceTag("", 0, "apple")).toEqual("apple");
  });

  test("index out of string bounds", () => {
    expect(replaceTag("", -1, "apple")).toEqual("");
    expect(replaceTag("", 1, "apple")).toEqual("");
    expect(replaceTag("", 2, "apple")).toEqual("");
  });

  test("replace negated tag", () => {
    expect(replaceTag("-hello world", 3, "goodbye")).toEqual("-goodbye world");
  });

  test.each([
    ["hello world", 0, "goodbye", "goodbye world"],
    ["hello world", 1, "goodbye", "goodbye world"],
    ["hello world", 2, "goodbye", "goodbye world"],
    ["hello world", 3, "goodbye", "goodbye world"],
    ["hello world", 4, "goodbye", "goodbye world"],
    ["hello world", 5, "goodbye", "goodbye world"],
    ["hello world", 6, "goodbye", "hello goodbye"],
    ["hello world", 7, "goodbye", "hello goodbye"],
    ["hello world", 8, "goodbye", "hello goodbye"],
    ["hello world", 9, "goodbye", "hello goodbye"],
    ["hello world", 10, "goodbye", "hello goodbye"],
    ["hello world", 11, "goodbye", "hello goodbye"]
  ])("replaceTag(%s, %i, %s)", (text, index, replacement, expected) => {
    expect(replaceTag(text, index, replacement)).toEqual(expected);
  });
});
