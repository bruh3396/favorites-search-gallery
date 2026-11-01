import { describe, expect, test } from "vitest";
import { SearchExpression } from "@/core/domain/search/expressions/search_expression";
import { parseSearchTerm } from "@/core/domain/search/parsers/search_term_parser";

const appleSearchExpression = SearchExpression.term(parseSearchTerm("apple"));
const bananaSearchExpression = SearchExpression.term(parseSearchTerm("banana"));

describe("SearchExpression", () => {
  describe("term", () => {
    test("wraps a term", () => {
      const searchTerm = parseSearchTerm("apple");

      expect(SearchExpression.term(searchTerm).node).toEqual({ kind: "term", term: searchTerm });
    });
  });

  describe("and", () => {
    test("joins children that must all match", () => {
      expect(SearchExpression.and([appleSearchExpression, bananaSearchExpression]).node)
        .toEqual({ kind: "and", childExpressions: [appleSearchExpression, bananaSearchExpression] });
    });
  });

  describe("or", () => {
    test("joins children of which any may match", () => {
      expect(SearchExpression.or([appleSearchExpression, bananaSearchExpression]).node)
        .toEqual({ kind: "or", childExpressions: [appleSearchExpression, bananaSearchExpression] });
    });
  });

  describe("not", () => {
    test("negates a child", () => {
      expect(SearchExpression.not(appleSearchExpression).node).toEqual({ kind: "not", childExpression: appleSearchExpression });
    });
  });
});
