import { createSearchable, fruits, getAllSubstrings, getPrefixes, searchableEmptyDoc, searchableFruitDoc } from "./fruit_search_fixtures";
import { describe, expect, test } from "vitest";
import { parseWildcardTag } from "../../lib/search/parse/tag_parser";

describe("wildcardSearchTag", () => {
  test("empty", () => {
    expect(parseWildcardTag("*").matches(searchableEmptyDoc)).toBe(false);
  });

  test("empty negated", () => {
    expect(parseWildcardTag("-*").matches(searchableEmptyDoc)).toBe(true);
  });

  test("one tag", () => {
    expect(parseWildcardTag("*").matches(createSearchable(["apple"]))).toBe(true);
  });

  test("match all", () => {
    expect(parseWildcardTag("*").matches(searchableFruitDoc)).toBe(true);
  });

  test("match none", () => {
    expect(parseWildcardTag("-*").matches(searchableFruitDoc)).toBe(false);
  });

  test("matches prefix", () => {
    for (const fruit of fruits) {
      for (const prefix of getPrefixes(fruit)) {
        expect(parseWildcardTag(`${prefix}*`).matches(searchableFruitDoc)).toBe(true);
      }
    }
  });

  test("matches double asterisk", () => {
    for (const fruit of fruits) {
      for (const substring of getAllSubstrings(fruit)) {
        expect(parseWildcardTag(`*${substring}*`).matches(searchableFruitDoc)).toBe(true);
        expect(parseWildcardTag(`**${substring}*`).matches(searchableFruitDoc)).toBe(true);
        expect(parseWildcardTag(`**${substring}***`).matches(searchableFruitDoc)).toBe(true);
        expect(parseWildcardTag(`*${substring}_NO_MATCH_*`).matches(searchableFruitDoc)).toBe(false);
      }
    }
  });

  test("matches inside", () => {
    expect(parseWildcardTag("*b*na*").matches(searchableFruitDoc)).toBe(true);
    expect(parseWildcardTag("*b*a*").matches(searchableFruitDoc)).toBe(true);
    expect(parseWildcardTag("*bna*").matches(searchableFruitDoc)).toBe(false);
  });

  test("compare cost", () => {
    const startsWithTag = parseWildcardTag("banana*");
    const containsTag = parseWildcardTag("*bana*");
    const containsTag2 = parseWildcardTag("*bana*****");
    const endsWithTag = parseWildcardTag("*banana");
    const regexTag = parseWildcardTag("*b*a*");

    expect(startsWithTag.cost).toBeLessThan(containsTag.cost);
    expect(startsWithTag.cost).toBeLessThan(endsWithTag.cost);
    expect(startsWithTag.cost).toBeLessThan(regexTag.cost);

    expect(containsTag.cost).toBeLessThan(endsWithTag.cost);
    expect(containsTag.cost).toBeLessThan(regexTag.cost);
    expect(containsTag.cost).toBe(containsTag2.cost);

    expect(endsWithTag.cost).toBe(regexTag.cost);
  });
});
