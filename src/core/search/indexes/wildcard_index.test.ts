import { describe, expect, test } from "vitest";
import { WildcardIndex } from "@/core/search/indexes/wildcard_index";
import { parseWildcardSearchTerm } from "@/core/search/parsers/search_term_parser";

const terms = ["banana", "band", "bandana", "brand", "grand", "island", "orange", "sand"].slice().sort();

function matches(index: WildcardIndex, pattern: string): string[] {
  return [...index.matchingTerms(parseWildcardSearchTerm(pattern))].sort();
}

function createIndex(): WildcardIndex {
  return new WildcardIndex(terms);
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
      expect(matches(new WildcardIndex(), "ban*")).toEqual([]);
    });
  });

  describe("add", () => {
    test("makes a new term matchable", () => {
      const index = new WildcardIndex(terms);

      index.add("bandit");
      expect(matches(index, "ban*")).toEqual(["banana", "band", "bandana", "bandit"]);
    });
  });

  describe("remove", () => {
    test("drops a term from matches", () => {
      const index = new WildcardIndex(terms);

      index.remove("band");
      expect(matches(index, "ban*")).toEqual(["banana", "bandana"]);
    });
  });

  describe("index", () => {
    test("replaces the corpus", () => {
      const index = new WildcardIndex(terms);

      index.index(["kiwi", "kumquat"]);
      expect(matches(index, "ban*")).toEqual([]);
      expect(matches(index, "k*")).toEqual(["kiwi", "kumquat"]);
    });
  });
});
