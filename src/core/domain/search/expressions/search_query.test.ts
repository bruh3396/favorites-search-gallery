import { describe, expect, test } from "vitest";
import { SearchQuery } from "@/core/domain/search/expressions/search_query";
import { Searchable } from "@/core/domain/search/searchable";
import { buildSearchable } from "@/core/domain/search/testing/searchable_builder";
import { parseSearchTerm } from "@/core/domain/search/parsers/search_term_parser";

const apple = buildSearchable(["red", "fruit", "sweet"]);
const cherry = buildSearchable(["red", "fruit"]);
const lemon = buildSearchable(["yellow", "fruit", "sour"]);
const corpus = [apple, cherry, lemon];

function createQuery(andTerms: string[], orGroups: string[][] = []): SearchQuery<Searchable> {
  return new SearchQuery(andTerms.map(parseSearchTerm), orGroups.map(group => group.map(parseSearchTerm)));
}

describe("SearchQuery", () => {
  describe("filter", () => {
    test("keeps every item for an empty query", () => {
      expect(new SearchQuery<Searchable>().filter(corpus)).toEqual(corpus);
    });

    test("keeps items matching every and-term", () => {
      expect(createQuery(["red", "fruit"]).filter(corpus)).toEqual([apple, cherry]);
    });

    test("keeps items matching a negated term's absence", () => {
      expect(createQuery(["-red"]).filter(corpus)).toEqual([lemon]);
    });

    test("keeps items matching any term of each or-group", () => {
      expect(createQuery([], [["sweet", "sour"]]).filter(corpus)).toEqual([apple, lemon]);
    });

    test("requires every or-group to match", () => {
      expect(createQuery([], [["sweet", "sour"], ["red"]]).filter(corpus)).toEqual([apple]);
    });

    test("combines and-terms with or-groups", () => {
      expect(createQuery(["fruit"], [["yellow", "sweet"]]).filter(corpus)).toEqual([apple, lemon]);
    });
  });
});
