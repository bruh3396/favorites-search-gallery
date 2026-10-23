import { describe, expect, test } from "vitest";
import { SearchExpression } from "@/core/domain/search/expressions/search_expression";
import { parseSearchTerm } from "@/core/domain/search/parsers/search_term_parser";

const apple = SearchExpression.term(parseSearchTerm("apple"));
const banana = SearchExpression.term(parseSearchTerm("banana"));

describe("SearchExpression", () => {
  describe("term", () => {
    test("wraps a term", () => {
      const term = parseSearchTerm("apple");

      expect(SearchExpression.term(term).node).toEqual({ kind: "term", term });
    });
  });

  describe("and", () => {
    test("joins children that must all match", () => {
      expect(SearchExpression.and([apple, banana]).node).toEqual({ kind: "and", children: [apple, banana] });
    });
  });

  describe("or", () => {
    test("joins children of which any may match", () => {
      expect(SearchExpression.or([apple, banana]).node).toEqual({ kind: "or", children: [apple, banana] });
    });
  });

  describe("not", () => {
    test("negates a child", () => {
      expect(SearchExpression.not(apple).node).toEqual({ kind: "not", child: apple });
    });
  });
});
