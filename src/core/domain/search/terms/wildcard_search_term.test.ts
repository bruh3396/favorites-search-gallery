import { describe, expect, test } from "vitest";
import { listPrefixes, listSubstrings } from "@/core/utils/string/string_utilities";
import { FRUIT_VOCABULARY } from "@/core/domain/search/testing/fruit_vocabulary";
import { buildSearchable } from "@/core/domain/search/testing/searchable_builder";
import { parseWildcardSearchTerm } from "@/core/domain/search/parsers/search_term_parser";

describe("WildcardSearchTerm", () => {
  test("rejects a doc with no tags", () => {
    expect(parseWildcardSearchTerm("*").matches(buildSearchable([]))).toBe(false);
  });

  test("matches a doc with no tags when negated", () => {
    expect(parseWildcardSearchTerm("-*").matches(buildSearchable([]))).toBe(true);
  });

  test("matches a doc with one tag", () => {
    expect(parseWildcardSearchTerm("*").matches(buildSearchable(["apple"]))).toBe(true);
  });

  test("matches every doc with tags through *", () => {
    expect(parseWildcardSearchTerm("*").matches(FRUIT_VOCABULARY)).toBe(true);
  });

  test("matches no doc with tags through -*", () => {
    expect(parseWildcardSearchTerm("-*").matches(FRUIT_VOCABULARY)).toBe(false);
  });

  test("matches every prefix", () => {
    for (const fruit of FRUIT_VOCABULARY.tags) {
      for (const prefix of listPrefixes(fruit)) {
        expect(parseWildcardSearchTerm(`${prefix}*`).matches(FRUIT_VOCABULARY)).toBe(true);
      }
    }
  });

  test("matches every substring between asterisks", () => {
    for (const fruit of FRUIT_VOCABULARY.tags) {
      for (const substring of listSubstrings(fruit)) {
        expect(parseWildcardSearchTerm(`*${substring}*`).matches(FRUIT_VOCABULARY)).toBe(true);
        expect(parseWildcardSearchTerm(`**${substring}*`).matches(FRUIT_VOCABULARY)).toBe(true);
        expect(parseWildcardSearchTerm(`**${substring}***`).matches(FRUIT_VOCABULARY)).toBe(true);
        expect(parseWildcardSearchTerm(`*${substring}_NO_MATCH_*`).matches(FRUIT_VOCABULARY)).toBe(false);
      }
    }
  });

  test("matches asterisks inside a tag", () => {
    expect(parseWildcardSearchTerm("*b*na*").matches(FRUIT_VOCABULARY)).toBe(true);
    expect(parseWildcardSearchTerm("*b*a*").matches(FRUIT_VOCABULARY)).toBe(true);
    expect(parseWildcardSearchTerm("*bna*").matches(FRUIT_VOCABULARY)).toBe(false);
  });

  test("ranks cost by pattern shape", () => {
    const startsWithWildcardSearchTerm = parseWildcardSearchTerm("banana*");
    const endsWithWildcardSearchTerm = parseWildcardSearchTerm("*banana");
    const substringWildcardSearchTerm = parseWildcardSearchTerm("*bana*");
    const secondSubstringWildcardSearchTerm = parseWildcardSearchTerm("*bana*****");
    const multiStarWildcardSearchTerm = parseWildcardSearchTerm("*b*a*");

    expect(startsWithWildcardSearchTerm.cost).toBeLessThan(endsWithWildcardSearchTerm.cost);
    expect(endsWithWildcardSearchTerm.cost).toBeLessThan(substringWildcardSearchTerm.cost);
    expect(substringWildcardSearchTerm.cost).toBeLessThan(multiStarWildcardSearchTerm.cost);
    expect(substringWildcardSearchTerm.cost).toBe(secondSubstringWildcardSearchTerm.cost);
  });
});
