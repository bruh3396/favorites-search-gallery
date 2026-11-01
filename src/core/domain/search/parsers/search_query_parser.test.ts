import { describe, expect, test } from "vitest";
import { Fruit } from "@/core/domain/search/testing/fruit";
import { parseSearchQuery } from "@/core/domain/search/parsers/search_query_parser";
import { parseSearchTerm } from "@/core/domain/search/parsers/search_term_parser";

function serializeQuery(query: string): string {
  const searchQuery = parseSearchQuery<Fruit>(query);
  return JSON.stringify({ orGroups: searchQuery.orGroups, andTerms: searchQuery.searchTerms });
}

function expectEquivalent(query1: string, query2: string): void {
  expect(serializeQuery(query1)).toBe(serializeQuery(query2));
}

function expectNotEquivalent(query1: string, query2: string): void {
  expect(serializeQuery(query1)).not.toBe(serializeQuery(query2));
}

function expectLiterals(query: string, andTerms: string[], orGroups: string[][]): void {
  const searchQuery = parseSearchQuery<Fruit>(query);

  expect({
    andTerms: searchQuery.searchTerms.map(searchTerm => searchTerm.literal),
    orGroups: searchQuery.orGroups.map(searchTerms => searchTerms.map(searchTerm => searchTerm.literal))
  }).toStrictEqual({ andTerms, orGroups });
}

describe("parseSearchQuery", () => {
  test("parses each string to a term", () => {
    expect(parseSearchQuery<Fruit>("mango").searchTerms).toStrictEqual([parseSearchTerm("mango")]);
  });

  test("orders terms by cost", () => {
    expect(parseSearchTerm("mango").cost).toBeLessThan(parseSearchTerm("*mango").cost);
    expectLiterals("*mango -mango mango -*mango", ["mango", "-mango", "*mango", "-*mango"], []);
  });

  test("parses blank input to no terms", () => {
    for (const query of ["", " ", "\n", "\t"]) {
      expectLiterals(query, [], []);
    }
  });

  test("parses and terms in order", () => {
    expectLiterals("grape", ["grape"], []);
    expectLiterals("cherry banana", ["cherry", "banana"], []);
    expectLiterals("apple orange grape", ["apple", "orange", "grape"], []);
  });

  test("keeps parentheses inside a term", () => {
    expectLiterals("apple_(red)", ["apple_(red)"], []);
    expectLiterals("apple_(red) banana_(yellow) grape", ["apple_(red)", "banana_(yellow)", "grape"], []);
  });

  test("parses or groups", () => {
    expectLiterals("( apple ~ banana )", [], [["apple", "banana"]]);
    expectLiterals("( apple ~ banana ) ( grape ~ orange )", [], [["apple", "banana"], ["grape", "orange"]]);
  });

  test("parses malformed groups as and terms", () => {
    expectLiterals("(apple )", ["(apple", ")"], []);
    expectLiterals("( apple", ["(", "apple"], []);
    expectLiterals("apple )", ["apple", ")"], []);
    expectLiterals("apple (", ["apple", "("], []);
    expectLiterals("(apple)", ["(apple)"], []);
  });

  test("parses and terms mixed with or groups", () => {
    expectLiterals(
      "apple ( banana ~ cherry ~ lime ) grape ( orange ~ pear ) kiwi",
      ["apple", "grape", "kiwi"],
      [["orange", "pear"], ["banana", "cherry", "lime"]]
    );
  });

  test("parses a negated group as and terms", () => {
    expectLiterals("-( apple )", ["apple", ")", "-("], []);
  });

  test("ignores extra spaces", () => {
    expectLiterals("  apple  ( banana ~ cherry )  grape  ", ["apple", "grape"], [["banana", "cherry"]]);
    expectLiterals(" apple                  banana    ( cherry ~ lime )", ["apple", "banana"], [["cherry", "lime"]]);
  });

  test("dedupes and terms by literal", () => {
    expectLiterals("apple apple banana", ["apple", "banana"], []);
  });

  test("keeps a term distinct from its negation", () => {
    expectLiterals("apple -apple", ["apple", "-apple"], []);
  });

  test("dedupes terms within an or group", () => {
    expectLiterals("( apple ~ apple ~ banana )", [], [["apple", "banana"]]);
  });

  test("flattens an or group that dedupes down to one term into an and term", () => {
    expectLiterals("( apple ~ apple )", ["apple"], []);
  });

  test("flattens singleton or groups into and terms", () => {
    expectLiterals("banana ( apple )", ["banana", "apple"], []);
    expectLiterals("( -apple ) ( banana ) ( -grape )", ["banana", "-apple", "-grape"], []);
  });

  test("ignores the order of terms and groups", () => {
    expectEquivalent("apple ( banana ~ cherry )", "( banana ~ cherry ) apple");
  });

  test("ignores duplicates in or groups", () => {
    expectEquivalent("apple ( banana ~ cherry )", "( banana ~ cherry ~ cherry ) apple");
  });

  test("orders or groups by length", () => {
    expectEquivalent("apple ( banana ~ cherry ~ pear ) ( grape ~ orange )", "apple ( grape ~ orange ) ( banana ~ cherry ~ pear )");
    expectNotEquivalent("apple ( grape ~ orange ) ( banana ~ cherry )", "apple  ( banana ~ cherry ) ( grape ~ orange )");
  });

  test("flattens or groups of one term", () => {
    expectEquivalent("-apple ( banana )", "banana -apple");
    expectEquivalent("-apple ( banana* ) ( cherry )", "cherry -apple banana*");
  });

  test("parses equal queries the same, ignoring surrounding whitespace", () => {
    expectEquivalent("apple", "apple");
    expectEquivalent("apple", "apple   ");
    expectEquivalent("  apple", "apple   ");
    expectEquivalent("", "");
  });

  test("parses different queries differently", () => {
    expectNotEquivalent("apple", "banana");
    expectNotEquivalent("apple sweet", "apple");
    expectNotEquivalent("( apple ~ banana )", "( apple ~ cherry )");
    expectNotEquivalent("apple -sweet", "apple sweet");
    expectNotEquivalent("app*", "apple");
  });

  test("parses a query of only an asterisk to no terms", () => {
    const searchQuery = parseSearchQuery<Fruit>("*");

    expect(searchQuery.searchTerms).toEqual([]);
    expect(searchQuery.orGroups).toEqual([]);
  });
});
