import { createSearchable, searchableEmptyDoc } from "@/core/search/testing/searchable";
import { describe, expect, test } from "vitest";
import { fruits, searchableFruitDoc } from "@/core/search/testing/fruit_corpus";
import { listPrefixes, listSubstrings } from "@/core/search/testing/string";
import { parseWildcardSearchTerm } from "@/core/search/parsers/search_term_parser";

describe("WildcardSearchTerm", () => {
  test("rejects a doc with no tags", () => {
    expect(parseWildcardSearchTerm("*").matches(searchableEmptyDoc)).toBe(false);
  });

  test("matches a doc with no tags when negated", () => {
    expect(parseWildcardSearchTerm("-*").matches(searchableEmptyDoc)).toBe(true);
  });

  test("matches a doc with one tag", () => {
    expect(parseWildcardSearchTerm("*").matches(createSearchable(["apple"]))).toBe(true);
  });

  test("matches every doc with tags through *", () => {
    expect(parseWildcardSearchTerm("*").matches(searchableFruitDoc)).toBe(true);
  });

  test("matches no doc with tags through -*", () => {
    expect(parseWildcardSearchTerm("-*").matches(searchableFruitDoc)).toBe(false);
  });

  test("matches every prefix", () => {
    for (const fruit of fruits) {
      for (const prefix of listPrefixes(fruit)) {
        expect(parseWildcardSearchTerm(`${prefix}*`).matches(searchableFruitDoc)).toBe(true);
      }
    }
  });

  test("matches every substring between asterisks", () => {
    for (const fruit of fruits) {
      for (const substring of listSubstrings(fruit)) {
        expect(parseWildcardSearchTerm(`*${substring}*`).matches(searchableFruitDoc)).toBe(true);
        expect(parseWildcardSearchTerm(`**${substring}*`).matches(searchableFruitDoc)).toBe(true);
        expect(parseWildcardSearchTerm(`**${substring}***`).matches(searchableFruitDoc)).toBe(true);
        expect(parseWildcardSearchTerm(`*${substring}_NO_MATCH_*`).matches(searchableFruitDoc)).toBe(false);
      }
    }
  });

  test("matches asterisks inside a tag", () => {
    expect(parseWildcardSearchTerm("*b*na*").matches(searchableFruitDoc)).toBe(true);
    expect(parseWildcardSearchTerm("*b*a*").matches(searchableFruitDoc)).toBe(true);
    expect(parseWildcardSearchTerm("*bna*").matches(searchableFruitDoc)).toBe(false);
  });

  test("ranks cost by pattern shape", () => {
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
