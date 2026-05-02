import { createSearchable, fruits, getAllSubstrings, getPrefixes, searchableEmpty, searchableFruits, searchableSortedFruits, sortedFruits } from "./search_test_utils";
import { describe, expect, test } from "vitest";
import { parseWildcardSearchTag } from "../lib/search/tag/search_tag_parser";

describe("wildcardSearchTag", () => {
  test("empty", () => {
    expect(parseWildcardSearchTag("*").matches(searchableEmpty)).toBe(false);
  });

  test("empty negated", () => {
    expect(parseWildcardSearchTag("-*").matches(searchableEmpty)).toBe(true);
  });

  test("one tag", () => {
    expect(parseWildcardSearchTag("*").matches(createSearchable(["apple"]))).toBe(true);
  });

  test("match all", () => {
    expect(parseWildcardSearchTag("*").matches(searchableFruits)).toBe(true);
  });

  test("match none", () => {
    expect(parseWildcardSearchTag("-*").matches(searchableFruits)).toBe(false);
  });

  test("matches prefix", () => {
    for (const fruit of sortedFruits) {
      for (const prefix of getPrefixes(fruit)) {
        expect(parseWildcardSearchTag(`${prefix}*`).matches(searchableSortedFruits)).toBe(true);
      }
    }
  });

  test("matches double asterisk", () => {
    for (const fruit of fruits) {
      for (const substring of getAllSubstrings(fruit)) {
        expect(parseWildcardSearchTag(`*${substring}*`).matches(searchableFruits)).toBe(true);
        expect(parseWildcardSearchTag(`**${substring}*`).matches(searchableFruits)).toBe(true);
        expect(parseWildcardSearchTag(`**${substring}***`).matches(searchableFruits)).toBe(true);
        expect(parseWildcardSearchTag(`*${substring}_NO_MATCH_*`).matches(searchableFruits)).toBe(false);
      }
    }
  });

  test("matches inside", () => {
    expect(parseWildcardSearchTag("*b*na*").matches(searchableFruits)).toBe(true);
    expect(parseWildcardSearchTag("*b*a*").matches(searchableSortedFruits)).toBe(true);
    expect(parseWildcardSearchTag("*bna*").matches(searchableSortedFruits)).toBe(false);
  });

  test("compare cost", () => {
    const startsWithTag = parseWildcardSearchTag("banana*");
    const containsTag = parseWildcardSearchTag("*bana*");
    const containsTag2 = parseWildcardSearchTag("*bana*****");
    const endsWithTag = parseWildcardSearchTag("*banana");
    const wildcardTag = parseWildcardSearchTag("*b*a*");

    expect(startsWithTag.cost).toBeLessThan(containsTag.cost);
    expect(startsWithTag.cost).toBeLessThan(endsWithTag.cost);
    expect(startsWithTag.cost).toBeLessThan(wildcardTag.cost);

    expect(containsTag.cost).toBeLessThan(endsWithTag.cost);
    expect(containsTag.cost).toBeLessThan(wildcardTag.cost);
    expect(containsTag.cost).toBe(containsTag2.cost);

    expect(endsWithTag.cost).toBe(wildcardTag.cost);
  });
});
