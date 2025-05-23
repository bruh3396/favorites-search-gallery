import { describe, expect, test } from "vitest";
import { getTagBoundary, replaceTag } from "../features/autocomplete/autocomplete_utils";

describe("getWordBoundaries", () => {
  test("empty", () => {
    expect(getTagBoundary("", 0)).toEqual({ start: 0, end: 0 });
  });

  test("index out of bounds", () => {
    expect(getTagBoundary("", 1)).toEqual({ start: 0, end: 0 });
    expect(getTagBoundary("", -1)).toEqual({ start: 0, end: 0 });
  });

  test("get tag boundaries", () => {
    expect(getTagBoundary("hello world", -1)).toEqual({ start: 0, end: 0 });
    expect(getTagBoundary("hello world", 0)).toEqual({ start: 0, end: 5 });
    expect(getTagBoundary("hello world", 1)).toEqual({ start: 0, end: 5 });
    expect(getTagBoundary("hello world", 2)).toEqual({ start: 0, end: 5 });
    expect(getTagBoundary("hello world", 3)).toEqual({ start: 0, end: 5 });
    expect(getTagBoundary("hello world", 4)).toEqual({ start: 0, end: 5 });
    expect(getTagBoundary("hello world", 5)).toEqual({ start: 0, end: 5 });

    expect(getTagBoundary("hello world", 6)).toEqual({ start: 6, end: 11 });
    expect(getTagBoundary("hello world", 7)).toEqual({ start: 6, end: 11 });
    expect(getTagBoundary("hello world", 8)).toEqual({ start: 6, end: 11 });
    expect(getTagBoundary("hello world", 9)).toEqual({ start: 6, end: 11 });
    expect(getTagBoundary("hello world", 10)).toEqual({ start: 6, end: 11 });
    expect(getTagBoundary("hello world", 11)).toEqual({ start: 6, end: 11 });
    expect(getTagBoundary("hello world", 12)).toEqual({ start: 0, end: 0 });

    expect(getTagBoundary("hello there world", 6)).toEqual({ start: 6, end: 11 });
  });

  test("negated tag", () => {
    expect(getTagBoundary("hello -world", 9)).toEqual({ start: 7, end: 12 });
    expect(getTagBoundary("hello -world", 8)).toEqual({ start: 7, end: 12 });
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

  test("replace tag", () => {
    expect(replaceTag("hello world", 0, "goodbye")).toEqual("goodbye world");
    expect(replaceTag("hello world", 1, "goodbye")).toEqual("goodbye world");
    expect(replaceTag("hello world", 2, "goodbye")).toEqual("goodbye world");
    expect(replaceTag("hello world", 3, "goodbye")).toEqual("goodbye world");
    expect(replaceTag("hello world", 4, "goodbye")).toEqual("goodbye world");
    expect(replaceTag("hello world", 5, "goodbye")).toEqual("goodbye world");

    expect(replaceTag("hello world", 6, "goodbye")).toEqual("hello goodbye");
    expect(replaceTag("hello world", 7, "goodbye")).toEqual("hello goodbye");
    expect(replaceTag("hello world", 8, "goodbye")).toEqual("hello goodbye");
    expect(replaceTag("hello world", 9, "goodbye")).toEqual("hello goodbye");
    expect(replaceTag("hello world", 10, "goodbye")).toEqual("hello goodbye");
    expect(replaceTag("hello world", 11, "goodbye")).toEqual("hello goodbye");
  });

  test("replace negated tag", () => {
    expect(replaceTag("-hello world", 3, "goodbye")).toEqual("-goodbye world");
  });
});
