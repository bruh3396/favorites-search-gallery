import { describe, expect, test } from "vitest";
import { parseSearchExpression } from "@/core/domain/search/parsers/search_expression_parser";
import { scanSearchSyntax } from "@/core/domain/search/parsers/search_syntax_scanner";

function scanWords(query: string): string[] {
  return scanSearchSyntax(query).map(({ start, end }) => query.slice(start, end));
}

function scanDepths(query: string): number[] {
  return scanSearchSyntax(query).map(({ depth }) => depth);
}

function scanMatchedStarts(query: string): (number | undefined)[] {
  return scanSearchSyntax(query).map(({ matchedStart }) => matchedStart);
}

describe("scanSearchSyntax", () => {
  test.each(["", "   ", "apple", "apple red -sour", "apple_(red)", "(a b)", "a~b", ":)", "-(apple", "--("])("finds no operators in '%s'", query => {
    expect(scanSearchSyntax(query)).toEqual([]);
  });

  test("finds each standalone operator at its offset in the raw text", () => {
    const query = "  ( apple ~ red )  -( sour )";

    expect(scanWords(query)).toEqual(["(", "~", ")", "-(", ")"]);
    expect(scanSearchSyntax(query).map(({ start }) => start)).toEqual([2, 10, 16, 19, 27]);
  });

  test("gives nested groups increasing depths", () => {
    expect(scanDepths("( a ( b ( c ) ) )")).toEqual([1, 2, 3, 3, 2, 1]);
  });

  test("gives sibling groups the same depth", () => {
    expect(scanDepths("( a ) ( b )")).toEqual([1, 1, 1, 1]);
  });

  test("points each paren at its partner's start", () => {
    expect(scanMatchedStarts("( a ( b ) ) -( c )")).toEqual([10, 8, 4, 0, 17, 12]);
  });

  test("gives ~ the depth of its group and no partner", () => {
    const query = "( a ~ ( b ~ c ) )";

    expect(scanDepths(query)).toEqual([1, 1, 2, 2, 2, 1]);
    expect(scanMatchedStarts(query)[1]).toBeUndefined();
  });

  test("keeps an unclosed ( at its depth with no partner", () => {
    expect(scanDepths("( a ( b )")).toEqual([1, 2, 2]);
    expect(scanMatchedStarts("( a ( b )")).toEqual([undefined, 8, 4]);
  });

  test("gives a stray ) depth 0 and no partner", () => {
    expect(scanDepths("a ) ( b )")).toEqual([0, 1, 1]);
    expect(scanMatchedStarts("a ) ( b )")).toEqual([undefined, 8, 4]);
  });

  test("gives a top-level ~ depth 0", () => {
    expect(scanDepths("a ~ b")).toEqual([0]);
  });

  test("reads -( as one operator", () => {
    expect(scanWords("-( a )")).toEqual(["-(", ")"]);
  });

  test("keeps a lone tab or no-break space inside a word, as the parser does", () => {
    expect(scanWords("( a\t) ( b )")).toEqual(["(", ")"]);
  });

  test("splits on a run of two or more whitespace characters", () => {
    expect(scanWords("(\t\ta\n\n)")).toEqual(["(", ")"]);
  });

  test.each([")", "( ~ )", "( )", "( a ~ b c )", "( ( (", "~ ~"])("does not throw on '%s', which the parser rejects", query => {
    expect(() => parseSearchExpression(query)).toThrow();
    expect(() => scanSearchSyntax(query)).not.toThrow();
  });
});
