import { describe, expect, test } from "vitest";
import { getTagBoundary, replaceTagInText } from "@/lib/ui/autocomplete/tag_replacer";

function replaceTag(text: string, selectionStart: number, replacement: string): string {
  return replaceTagInText(text, selectionStart, replacement).result;
}

describe("getTagBoundary", () => {
  test("returns an empty boundary for empty text", () => {
    expect(getTagBoundary("", 0)).toEqual({ start: 0, end: 0 });
  });

  test("returns an empty boundary for an index out of bounds", () => {
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
  ])("finds the tag around index %i of %s", (text, index, expected) => {
    expect(getTagBoundary(text, index)).toEqual(expected);
  });

  test.each([
    ["hello -world", 9, { start: 7, end: 12 }],
    ["hello -world", 8, { start: 7, end: 12 }]
  ])("excludes the dash of a negated tag in %s at %i", (text, index, expected) => {
    expect(getTagBoundary(text, index)).toEqual(expected);
  });

  test("returns an empty boundary when the cursor is between spaces", () => {
    expect(getTagBoundary("hello  world", 6)).toEqual({ start: 6, end: 6 });
  });
});

describe("replaceTagInText", () => {
  test("inserts the replacement into empty text", () => {
    expect(replaceTag("", 0, "apple")).toEqual("apple");
  });

  test("leaves the text alone for an index out of bounds", () => {
    expect(replaceTag("", -1, "apple")).toEqual("");
    expect(replaceTag("", 1, "apple")).toEqual("");
    expect(replaceTag("", 2, "apple")).toEqual("");
  });

  test("keeps the dash when replacing a negated tag", () => {
    expect(replaceTag("-hello world", 3, "goodbye")).toEqual("-goodbye world");
  });

  test.each([
    [0, "goodbye world"],
    [1, "goodbye world"],
    [2, "goodbye world"],
    [3, "goodbye world"],
    [4, "goodbye world"],
    [5, "goodbye world"],
    [6, "hello goodbye"],
    [7, "hello goodbye"],
    [8, "hello goodbye"],
    [9, "hello goodbye"],
    [10, "hello goodbye"],
    [11, "hello goodbye"]
  ])("replaces the tag at index %i of \"hello world\"", (index, expected) => {
    expect(replaceTag("hello world", index, "goodbye")).toEqual(expected);
  });
});
