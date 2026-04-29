import { SEARCHABLE_EMPTY, SEARCHABLE_FRUITS } from "./search_test_utils";
import { describe, expect, test } from "vitest";
import { parseExactSearchTag } from "../lib/search/tag/search_tag_parser";

describe("searchTag", () => {
  test("empty", () => {
    expect(parseExactSearchTag("").matches(SEARCHABLE_FRUITS)).toBe(false);
  });

  test("cost relation", () => {
    const searchTag = parseExactSearchTag("foo");
    const negatedSearchTag = parseExactSearchTag("-foo");

    expect(searchTag.cost).toBeLessThan(negatedSearchTag.cost);
  });

  test("matches", () => {
    expect(parseExactSearchTag("banana").matches(SEARCHABLE_FRUITS)).toBe(true);
    expect(parseExactSearchTag("kiwi").matches(SEARCHABLE_FRUITS)).toBe(true);
    expect(parseExactSearchTag("grape").matches(SEARCHABLE_FRUITS)).toBe(true);
    expect(parseExactSearchTag("apple").matches(SEARCHABLE_FRUITS)).toBe(true);
    expect(parseExactSearchTag("orange").matches(SEARCHABLE_FRUITS)).toBe(true);
    expect(parseExactSearchTag("mango").matches(SEARCHABLE_FRUITS)).toBe(true);

    expect(parseExactSearchTag("rose").matches(SEARCHABLE_FRUITS)).toBe(false);
    expect(parseExactSearchTag("tulip").matches(SEARCHABLE_FRUITS)).toBe(false);
    expect(parseExactSearchTag("daisy").matches(SEARCHABLE_FRUITS)).toBe(false);
    expect(parseExactSearchTag("lily").matches(SEARCHABLE_FRUITS)).toBe(false);
    expect(parseExactSearchTag("orchid").matches(SEARCHABLE_FRUITS)).toBe(false);
    expect(parseExactSearchTag("sunflower").matches(SEARCHABLE_FRUITS)).toBe(false);
  });

  test("negated matches", () => {
    expect(parseExactSearchTag("-banana").matches(SEARCHABLE_FRUITS)).toBe(false);
    expect(parseExactSearchTag("-kiwi").matches(SEARCHABLE_FRUITS)).toBe(false);
    expect(parseExactSearchTag("-grape").matches(SEARCHABLE_FRUITS)).toBe(false);
    expect(parseExactSearchTag("-apple").matches(SEARCHABLE_FRUITS)).toBe(false);
    expect(parseExactSearchTag("-orange").matches(SEARCHABLE_FRUITS)).toBe(false);
    expect(parseExactSearchTag("-mango").matches(SEARCHABLE_FRUITS)).toBe(false);

    expect(parseExactSearchTag("-rose").matches(SEARCHABLE_FRUITS)).toBe(true);
    expect(parseExactSearchTag("-tulip").matches(SEARCHABLE_FRUITS)).toBe(true);
    expect(parseExactSearchTag("-daisy").matches(SEARCHABLE_FRUITS)).toBe(true);
    expect(parseExactSearchTag("-lily").matches(SEARCHABLE_FRUITS)).toBe(true);
    expect(parseExactSearchTag("-orchid").matches(SEARCHABLE_FRUITS)).toBe(true);
    expect(parseExactSearchTag("-sunflower").matches(SEARCHABLE_FRUITS)).toBe(true);
  });

  test("negated matches with empty set", () => {
    expect(parseExactSearchTag("-banana").matches(SEARCHABLE_EMPTY)).toBe(true);
  });

  test("only negated character", () => {
    expect(parseExactSearchTag("-").matches(SEARCHABLE_EMPTY)).toBe(false);
  });

  test("space character", () => {
    expect(parseExactSearchTag(" ").matches(SEARCHABLE_EMPTY)).toBe(false);
  });

  test("multiple spaces", () => {
    expect(parseExactSearchTag("   ").matches(SEARCHABLE_EMPTY)).toBe(false);
  });

  test("non-space character", () => {
    expect(parseExactSearchTag("a").matches(SEARCHABLE_EMPTY)).toBe(false);
  });
});
