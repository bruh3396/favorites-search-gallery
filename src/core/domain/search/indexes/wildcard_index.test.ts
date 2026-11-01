import { describe, expect, test } from "vitest";
import { WildcardIndex } from "@/core/domain/search/indexes/wildcard_index";
import { parseWildcardSearchTerm } from "@/core/domain/search/parsers/search_term_parser";
import { StringInterner } from "@/core/utils/string/string_interner";

const terms = ["banana", "band", "bandana", "brand", "grand", "island", "orange", "sand"].slice().sort();

function matches(wildcardIndex: WildcardIndex, pattern: string): string[] {
  return [...wildcardIndex.matchingTerms(parseWildcardSearchTerm(pattern))].sort();
}

function createIndex(): WildcardIndex {
  return new WildcardIndex(new StringInterner(), terms);
}

describe("WildcardIndex", () => {
  describe("matchingTerms", () => {
    test("matches terms starting with the fragment for a prefix pattern", () => {
      expect(matches(createIndex(), "ban*")).toEqual(["banana", "band", "bandana"]);
    });

    test("matches terms ending with the fragment for a suffix pattern", () => {
      expect(matches(createIndex(), "*and")).toEqual(["band", "brand", "grand", "island", "sand"]);
    });

    test("matches terms containing the fragment for a substring pattern", () => {
      expect(matches(createIndex(), "*an*")).toEqual(["banana", "band", "bandana", "brand", "grand", "island", "orange", "sand"]);
    });

    test("matches terms against the regex for a multi-star pattern", () => {
      expect(matches(createIndex(), "b*d*a")).toEqual(["bandana"]);
    });

    test("returns nothing for a pattern with no matches", () => {
      expect(matches(createIndex(), "zzz*")).toEqual([]);
    });

    test("returns nothing from an empty index", () => {
      expect(matches(new WildcardIndex(new StringInterner()), "ban*")).toEqual([]);
    });
  });

  describe("add", () => {
    test("makes a new term matchable", () => {
      const wildcardIndex = new WildcardIndex(new StringInterner(), terms);

      wildcardIndex.add("bandit");
      expect(matches(wildcardIndex, "ban*")).toEqual(["banana", "band", "bandana", "bandit"]);
    });
  });

  describe("remove", () => {
    test("drops a term from matches", () => {
      const wildcardIndex = new WildcardIndex(new StringInterner(), terms);

      wildcardIndex.remove("band");
      expect(matches(wildcardIndex, "ban*")).toEqual(["banana", "bandana"]);
    });
  });

  describe("index", () => {
    test("replaces the corpus", () => {
      const wildcardIndex = new WildcardIndex(new StringInterner(), terms);

      wildcardIndex.index(["kiwi", "kumquat"]);
      expect(matches(wildcardIndex, "ban*")).toEqual([]);
      expect(matches(wildcardIndex, "k*")).toEqual(["kiwi", "kumquat"]);
    });
  });
});
