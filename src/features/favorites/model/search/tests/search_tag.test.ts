import { SEARCHABLE_EMPTY, SEARCHABLE_FRUITS } from "./search_test_utils";
import { describe, expect, test } from "vitest";
import { SearchTag } from "../search_tags/search_tag";

describe("searchTag", () => {
  test("empty", () => {
    expect(new SearchTag("").matches(SEARCHABLE_FRUITS)).toBe(false);
  });

  test("cost relation", () => {
    const searchTag = new SearchTag("foo");
    const negatedSearchTag = new SearchTag("-foo");

    expect(searchTag.finalCost).toBeLessThan(negatedSearchTag.finalCost);
  });

  test("matches", () => {
    expect(new SearchTag("banana").matches(SEARCHABLE_FRUITS)).toBe(true);
    expect(new SearchTag("kiwi").matches(SEARCHABLE_FRUITS)).toBe(true);
    expect(new SearchTag("grape").matches(SEARCHABLE_FRUITS)).toBe(true);
    expect(new SearchTag("apple").matches(SEARCHABLE_FRUITS)).toBe(true);
    expect(new SearchTag("orange").matches(SEARCHABLE_FRUITS)).toBe(true);
    expect(new SearchTag("mango").matches(SEARCHABLE_FRUITS)).toBe(true);

    expect(new SearchTag("rose").matches(SEARCHABLE_FRUITS)).toBe(false);
    expect(new SearchTag("tulip").matches(SEARCHABLE_FRUITS)).toBe(false);
    expect(new SearchTag("daisy").matches(SEARCHABLE_FRUITS)).toBe(false);
    expect(new SearchTag("lily").matches(SEARCHABLE_FRUITS)).toBe(false);
    expect(new SearchTag("orchid").matches(SEARCHABLE_FRUITS)).toBe(false);
    expect(new SearchTag("sunflower").matches(SEARCHABLE_FRUITS)).toBe(false);
  });

  test("negated matches", () => {
    expect(new SearchTag("-banana").matches(SEARCHABLE_FRUITS)).toBe(false);
    expect(new SearchTag("-kiwi").matches(SEARCHABLE_FRUITS)).toBe(false);
    expect(new SearchTag("-grape").matches(SEARCHABLE_FRUITS)).toBe(false);
    expect(new SearchTag("-apple").matches(SEARCHABLE_FRUITS)).toBe(false);
    expect(new SearchTag("-orange").matches(SEARCHABLE_FRUITS)).toBe(false);
    expect(new SearchTag("-mango").matches(SEARCHABLE_FRUITS)).toBe(false);

    expect(new SearchTag("-rose").matches(SEARCHABLE_FRUITS)).toBe(true);
    expect(new SearchTag("-tulip").matches(SEARCHABLE_FRUITS)).toBe(true);
    expect(new SearchTag("-daisy").matches(SEARCHABLE_FRUITS)).toBe(true);
    expect(new SearchTag("-lily").matches(SEARCHABLE_FRUITS)).toBe(true);
    expect(new SearchTag("-orchid").matches(SEARCHABLE_FRUITS)).toBe(true);
    expect(new SearchTag("-sunflower").matches(SEARCHABLE_FRUITS)).toBe(true);
  });

  test("negated matches with empty set", () => {
    expect(new SearchTag("-banana").matches(SEARCHABLE_EMPTY)).toBe(true);
  });

  test("only negated character", () => {
    expect(new SearchTag("-").matches(SEARCHABLE_EMPTY)).toBe(false);
  });

  test("space character", () => {
    expect(new SearchTag(" ").matches(SEARCHABLE_EMPTY)).toBe(false);
  });

  test("multiple spaces", () => {
    expect(new SearchTag("   ").matches(SEARCHABLE_EMPTY)).toBe(false);
  });

  test("non-space character", () => {
    expect(new SearchTag("a").matches(SEARCHABLE_EMPTY)).toBe(false);
  });
});
