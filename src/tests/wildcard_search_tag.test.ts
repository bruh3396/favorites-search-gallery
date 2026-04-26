import { FRUITS, SEARCHABLE_EMPTY, SEARCHABLE_FRUITS, SEARCHABLE_SORTED_FRUITS, SORTED_FRUITS, createSearchable, getAllSubstrings, getPrefixes } from "./search_test_utils";
import { describe, expect, test } from "vitest";
import { parseWildcardSearchTag } from "../lib/search/tag/search_tag_parser";

describe("wildcardSearchTag", () => {
  test("empty", () => {
    expect(parseWildcardSearchTag("*").matches(SEARCHABLE_EMPTY)).toBe(false);
  });

  test("empty negated", () => {
    expect(parseWildcardSearchTag("-*").matches(SEARCHABLE_EMPTY)).toBe(true);
  });

  test("one tag", () => {
    expect(parseWildcardSearchTag("*").matches(createSearchable(["apple"]))).toBe(true);
  });

  test("match all", () => {
    expect(parseWildcardSearchTag("*").matches(SEARCHABLE_FRUITS)).toBe(true);
  });

  test("match none", () => {
    expect(parseWildcardSearchTag("-*").matches(SEARCHABLE_FRUITS)).toBe(false);
  });

  test("matches prefix", () => {
    for (const fruit of SORTED_FRUITS) {
      for (const prefix of getPrefixes(fruit)) {
        expect(parseWildcardSearchTag(`${prefix}*`).matches(SEARCHABLE_SORTED_FRUITS)).toBe(true);
      }
    }
  });

  test("matches double asterisk", () => {
    for (const fruit of FRUITS) {
      for (const substring of getAllSubstrings(fruit)) {
        expect(parseWildcardSearchTag(`*${substring}*`).matches(SEARCHABLE_FRUITS)).toBe(true);
        expect(parseWildcardSearchTag(`**${substring}*`).matches(SEARCHABLE_FRUITS)).toBe(true);
        expect(parseWildcardSearchTag(`**${substring}***`).matches(SEARCHABLE_FRUITS)).toBe(true);
        expect(parseWildcardSearchTag(`*${substring}_NO_MATCH_*`).matches(SEARCHABLE_FRUITS)).toBe(false);
      }
    }
  });

  test("matches inside", () => {
    expect(parseWildcardSearchTag("*b*na*").matches(SEARCHABLE_FRUITS)).toBe(true);
    expect(parseWildcardSearchTag("*b*a*").matches(SEARCHABLE_SORTED_FRUITS)).toBe(true);
    expect(parseWildcardSearchTag("*bna*").matches(SEARCHABLE_SORTED_FRUITS)).toBe(false);
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
