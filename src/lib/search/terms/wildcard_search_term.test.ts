import { createSearchable, fruits, getAllSubstrings, getPrefixes, searchableEmptyDoc, searchableFruitDoc } from "@/lib/search/fruit_search_fixture";
import { describe, expect, test } from "vitest";
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
    const startsWithTerm = parseWildcardSearchTerm("banana*");
    const containsTerm = parseWildcardSearchTerm("*bana*");
    const containsTerm2 = parseWildcardSearchTerm("*bana*****");
    const endsWithTerm = parseWildcardSearchTerm("*banana");
    const regexTerm = parseWildcardSearchTerm("*b*a*");

    expect(startsWithTerm.cost).toBeLessThan(containsTerm.cost);
    expect(startsWithTerm.cost).toBeLessThan(endsWithTerm.cost);
    expect(startsWithTerm.cost).toBeLessThan(regexTerm.cost);

    expect(containsTerm.cost).toBeLessThan(endsWithTerm.cost);
    expect(containsTerm.cost).toBeLessThan(regexTerm.cost);
    expect(containsTerm.cost).toBe(containsTerm2.cost);

    expect(endsWithTerm.cost).toBe(regexTerm.cost);
  });
});
