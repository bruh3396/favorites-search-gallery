import { SEARCHABLE_EMPTY, SEARCHABLE_FRUITS } from "./search_test_utils";
import { describe, expect, test } from "vitest";
import { parsePlainSearchTag } from "../lib/search/tag/search_tag_parser";

describe("searchTag", () => {
  test("empty", () => {
    expect(parsePlainSearchTag("").matches(SEARCHABLE_FRUITS)).toBe(false);
  });

  test("cost relation", () => {
    const searchTag = parsePlainSearchTag("foo");
    const negatedSearchTag = parsePlainSearchTag("-foo");

    expect(searchTag.cost).toBeLessThan(negatedSearchTag.cost);
  });

  test("matches", () => {
    expect(parsePlainSearchTag("banana").matches(SEARCHABLE_FRUITS)).toBe(true);
    expect(parsePlainSearchTag("kiwi").matches(SEARCHABLE_FRUITS)).toBe(true);
    expect(parsePlainSearchTag("grape").matches(SEARCHABLE_FRUITS)).toBe(true);
    expect(parsePlainSearchTag("apple").matches(SEARCHABLE_FRUITS)).toBe(true);
    expect(parsePlainSearchTag("orange").matches(SEARCHABLE_FRUITS)).toBe(true);
    expect(parsePlainSearchTag("mango").matches(SEARCHABLE_FRUITS)).toBe(true);

    expect(parsePlainSearchTag("rose").matches(SEARCHABLE_FRUITS)).toBe(false);
    expect(parsePlainSearchTag("tulip").matches(SEARCHABLE_FRUITS)).toBe(false);
    expect(parsePlainSearchTag("daisy").matches(SEARCHABLE_FRUITS)).toBe(false);
    expect(parsePlainSearchTag("lily").matches(SEARCHABLE_FRUITS)).toBe(false);
    expect(parsePlainSearchTag("orchid").matches(SEARCHABLE_FRUITS)).toBe(false);
    expect(parsePlainSearchTag("sunflower").matches(SEARCHABLE_FRUITS)).toBe(false);
  });

  test("negated matches", () => {
    expect(parsePlainSearchTag("-banana").matches(SEARCHABLE_FRUITS)).toBe(false);
    expect(parsePlainSearchTag("-kiwi").matches(SEARCHABLE_FRUITS)).toBe(false);
    expect(parsePlainSearchTag("-grape").matches(SEARCHABLE_FRUITS)).toBe(false);
    expect(parsePlainSearchTag("-apple").matches(SEARCHABLE_FRUITS)).toBe(false);
    expect(parsePlainSearchTag("-orange").matches(SEARCHABLE_FRUITS)).toBe(false);
    expect(parsePlainSearchTag("-mango").matches(SEARCHABLE_FRUITS)).toBe(false);

    expect(parsePlainSearchTag("-rose").matches(SEARCHABLE_FRUITS)).toBe(true);
    expect(parsePlainSearchTag("-tulip").matches(SEARCHABLE_FRUITS)).toBe(true);
    expect(parsePlainSearchTag("-daisy").matches(SEARCHABLE_FRUITS)).toBe(true);
    expect(parsePlainSearchTag("-lily").matches(SEARCHABLE_FRUITS)).toBe(true);
    expect(parsePlainSearchTag("-orchid").matches(SEARCHABLE_FRUITS)).toBe(true);
    expect(parsePlainSearchTag("-sunflower").matches(SEARCHABLE_FRUITS)).toBe(true);
  });

  test("negated matches with empty set", () => {
    expect(parsePlainSearchTag("-banana").matches(SEARCHABLE_EMPTY)).toBe(true);
  });

  test("only negated character", () => {
    expect(parsePlainSearchTag("-").matches(SEARCHABLE_EMPTY)).toBe(false);
  });

  test("space character", () => {
    expect(parsePlainSearchTag(" ").matches(SEARCHABLE_EMPTY)).toBe(false);
  });

  test("multiple spaces", () => {
    expect(parsePlainSearchTag("   ").matches(SEARCHABLE_EMPTY)).toBe(false);
  });

  test("non-space character", () => {
    expect(parsePlainSearchTag("a").matches(SEARCHABLE_EMPTY)).toBe(false);
  });
});
