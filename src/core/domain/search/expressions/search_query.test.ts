import { describe, expect, test } from "vitest";
import { SearchQuery } from "@/core/domain/search/expressions/search_query";
import { Searchable } from "@/core/domain/search/searchable";
import { buildSearchable } from "@/core/domain/search/testing/searchable_builder";
import { parseSearchTerm } from "@/core/domain/search/parsers/search_term_parser";

const appleSearchable = buildSearchable(["red", "fruit", "sweet"]);
const cherrySearchable = buildSearchable(["red", "fruit"]);
const lemonSearchable = buildSearchable(["yellow", "fruit", "sour"]);
const searchables = [appleSearchable, cherrySearchable, lemonSearchable];

function createQuery(andTerms: string[], orGroups: string[][] = []): SearchQuery<Searchable> {
  return new SearchQuery(andTerms.map(parseSearchTerm), orGroups.map(group => group.map(parseSearchTerm)));
}

describe("SearchQuery", () => {
  describe("filter", () => {
    test("keeps every item for an empty query", () => {
      expect(new SearchQuery<Searchable>().filter(searchables)).toEqual(searchables);
    });

    test("keeps items matching every and-term", () => {
      expect(createQuery(["red", "fruit"]).filter(searchables)).toEqual([appleSearchable, cherrySearchable]);
    });

    test("keeps items matching a negated term's absence", () => {
      expect(createQuery(["-red"]).filter(searchables)).toEqual([lemonSearchable]);
    });

    test("keeps items matching any term of each or-group", () => {
      expect(createQuery([], [["sweet", "sour"]]).filter(searchables)).toEqual([appleSearchable, lemonSearchable]);
    });

    test("requires every or-group to match", () => {
      expect(createQuery([], [["sweet", "sour"], ["red"]]).filter(searchables)).toEqual([appleSearchable]);
    });

    test("combines and-terms with or-groups", () => {
      expect(createQuery(["fruit"], [["yellow", "sweet"]]).filter(searchables)).toEqual([appleSearchable, lemonSearchable]);
    });
  });
});
