import { createSearchable, searchableEmptyDoc } from "@/lib/search/testing/searchable";
import { describe, expect, test } from "vitest";
import { fruits, searchableFruitDoc } from "@/lib/search/testing/fruit_corpus";
import { prefixesOf, substringsOf } from "@/lib/search/testing/string";
import { parseWildcardSearchTerm } from "@/lib/search/parsers/search_term_parser";

describe("WildcardSearchTerm", () => {
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
      for (const prefix of prefixesOf(fruit)) {
        expect(parseWildcardSearchTerm(`${prefix}*`).matches(searchableFruitDoc)).toBe(true);
      }
    }
  });

  test("matches double asterisk", () => {
    for (const fruit of fruits) {
      for (const substring of substringsOf(fruit)) {
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
    const startsWithTerm = parseWildcardSearchTerm("banana*");
    const endsWithTerm = parseWildcardSearchTerm("*banana");
    const substringTerm = parseWildcardSearchTerm("*bana*");
    const substringTerm2 = parseWildcardSearchTerm("*bana*****");
    const multiStarTerm = parseWildcardSearchTerm("*b*a*");

    expect(startsWithTerm.cost).toBeLessThan(endsWithTerm.cost);
    expect(endsWithTerm.cost).toBeLessThan(substringTerm.cost);
    expect(substringTerm.cost).toBeLessThan(multiStarTerm.cost);
    expect(substringTerm.cost).toBe(substringTerm2.cost);
  });
});
