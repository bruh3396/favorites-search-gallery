import { createSearchable, fruits, getAllSubstrings, getPrefixes, searchableEmptyDoc, searchableFruitDoc } from "./fruit_search_fixtures";
import { describe, expect, test } from "vitest";
import { parseWildcardSearchTerm } from "../../lib/search/parsers/search_term_parser";

describe("wildcardSearchTag", () => {
  test("empty", () => {
    expect(parseWildcardSearchTerm("*").matches(searchableEmptyDoc)).toBe(false);
  });

  test("empty negated", () => {
    expect(parseWildcardSearchTerm("-*").matches(searchableEmptyDoc)).toBe(true);
  });

  test("one tag", () => {
    expect(parseWildcardSearchTerm("*").matches(createSearchable(["apple"]))).toBe(true);
  });

  test("match all", () => {
    expect(parseWildcardSearchTerm("*").matches(searchableFruitDoc)).toBe(true);
  });

  test("match none", () => {
    expect(parseWildcardSearchTerm("-*").matches(searchableFruitDoc)).toBe(false);
  });

  test("matches prefix", () => {
    for (const fruit of fruits) {
      for (const prefix of getPrefixes(fruit)) {
        expect(parseWildcardSearchTerm(`${prefix}*`).matches(searchableFruitDoc)).toBe(true);
      }
    }
  });

  test("matches double asterisk", () => {
    for (const fruit of fruits) {
      for (const substring of getAllSubstrings(fruit)) {
        expect(parseWildcardSearchTerm(`*${substring}*`).matches(searchableFruitDoc)).toBe(true);
        expect(parseWildcardSearchTerm(`**${substring}*`).matches(searchableFruitDoc)).toBe(true);
        expect(parseWildcardSearchTerm(`**${substring}***`).matches(searchableFruitDoc)).toBe(true);
        expect(parseWildcardSearchTerm(`*${substring}_NO_MATCH_*`).matches(searchableFruitDoc)).toBe(false);
      }
    }
  });

  test("matches inside", () => {
    expect(parseWildcardSearchTerm("*b*na*").matches(searchableFruitDoc)).toBe(true);
    expect(parseWildcardSearchTerm("*b*a*").matches(searchableFruitDoc)).toBe(true);
    expect(parseWildcardSearchTerm("*bna*").matches(searchableFruitDoc)).toBe(false);
  });

  test("compare cost", () => {
    const startsWithTag = parseWildcardSearchTerm("banana*");
    const containsTag = parseWildcardSearchTerm("*bana*");
    const containsTag2 = parseWildcardSearchTerm("*bana*****");
    const endsWithTag = parseWildcardSearchTerm("*banana");
    const regexTag = parseWildcardSearchTerm("*b*a*");

    expect(startsWithTag.cost).toBeLessThan(containsTag.cost);
    expect(startsWithTag.cost).toBeLessThan(endsWithTag.cost);
    expect(startsWithTag.cost).toBeLessThan(regexTag.cost);

    expect(containsTag.cost).toBeLessThan(endsWithTag.cost);
    expect(containsTag.cost).toBeLessThan(regexTag.cost);
    expect(containsTag.cost).toBe(containsTag2.cost);

    expect(endsWithTag.cost).toBe(regexTag.cost);
  });
});
