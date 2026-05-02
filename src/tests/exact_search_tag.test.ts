import { describe, expect, test } from "vitest";
import { searchableEmpty, searchableFruits } from "./search_test_utils";
import { parseExactSearchTag } from "../lib/search/tag/search_tag_parser";

describe("searchTag", () => {
  test("empty", () => {
    expect(parseExactSearchTag("").matches(searchableFruits)).toBe(false);
  });

  test("cost relation", () => {
    const searchTag = parseExactSearchTag("foo");
    const negatedSearchTag = parseExactSearchTag("-foo");

    expect(searchTag.cost).toBeLessThan(negatedSearchTag.cost);
  });

  test("matches", () => {
    expect(parseExactSearchTag("banana").matches(searchableFruits)).toBe(true);
    expect(parseExactSearchTag("kiwi").matches(searchableFruits)).toBe(true);
    expect(parseExactSearchTag("grape").matches(searchableFruits)).toBe(true);
    expect(parseExactSearchTag("apple").matches(searchableFruits)).toBe(true);
    expect(parseExactSearchTag("orange").matches(searchableFruits)).toBe(true);
    expect(parseExactSearchTag("mango").matches(searchableFruits)).toBe(true);

    expect(parseExactSearchTag("rose").matches(searchableFruits)).toBe(false);
    expect(parseExactSearchTag("tulip").matches(searchableFruits)).toBe(false);
    expect(parseExactSearchTag("daisy").matches(searchableFruits)).toBe(false);
    expect(parseExactSearchTag("lily").matches(searchableFruits)).toBe(false);
    expect(parseExactSearchTag("orchid").matches(searchableFruits)).toBe(false);
    expect(parseExactSearchTag("sunflower").matches(searchableFruits)).toBe(false);
  });

  test("negated matches", () => {
    expect(parseExactSearchTag("-banana").matches(searchableFruits)).toBe(false);
    expect(parseExactSearchTag("-kiwi").matches(searchableFruits)).toBe(false);
    expect(parseExactSearchTag("-grape").matches(searchableFruits)).toBe(false);
    expect(parseExactSearchTag("-apple").matches(searchableFruits)).toBe(false);
    expect(parseExactSearchTag("-orange").matches(searchableFruits)).toBe(false);
    expect(parseExactSearchTag("-mango").matches(searchableFruits)).toBe(false);

    expect(parseExactSearchTag("-rose").matches(searchableFruits)).toBe(true);
    expect(parseExactSearchTag("-tulip").matches(searchableFruits)).toBe(true);
    expect(parseExactSearchTag("-daisy").matches(searchableFruits)).toBe(true);
    expect(parseExactSearchTag("-lily").matches(searchableFruits)).toBe(true);
    expect(parseExactSearchTag("-orchid").matches(searchableFruits)).toBe(true);
    expect(parseExactSearchTag("-sunflower").matches(searchableFruits)).toBe(true);
  });

  test("negated matches with empty set", () => {
    expect(parseExactSearchTag("-banana").matches(searchableEmpty)).toBe(true);
  });

  test("only negated character", () => {
    expect(parseExactSearchTag("-").matches(searchableEmpty)).toBe(false);
  });

  test("space character", () => {
    expect(parseExactSearchTag(" ").matches(searchableEmpty)).toBe(false);
  });

  test("multiple spaces", () => {
    expect(parseExactSearchTag("   ").matches(searchableEmpty)).toBe(false);
  });

  test("non-space character", () => {
    expect(parseExactSearchTag("a").matches(searchableEmpty)).toBe(false);
  });
});
