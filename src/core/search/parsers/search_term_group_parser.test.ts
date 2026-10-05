import { buildSearchTermGroup, normalizeSearchQuery, parseSearchQuery, parseTermGroups, sortSearchTermGroup } from "@/core/search/parsers/search_term_group_parser";
import { describe, expect, test } from "vitest";
import { Fruit } from "@/core/search/testing/fruit_corpus";
import { parseSearchTerm } from "@/core/search/parsers/search_term_parser";

function serializeQuery(query: string): string {
  const searchQuery = parseSearchQuery<Fruit>(query);
  return JSON.stringify({ orGroups: searchQuery.orGroups, andTerms: searchQuery.andTerms });
}

function expectEquivalent(query1: string, query2: string): void {
  expect(serializeQuery(query1)).toBe(serializeQuery(query2));
}

function expectNotEquivalent(query1: string, query2: string): void {
  expect(serializeQuery(query1)).not.toBe(serializeQuery(query2));
}

describe("buildSearchTermGroup", () => {
  test("parses each string to a term", () => {
    expect(buildSearchTermGroup(["mango", "*mango", "-mango"])).toStrictEqual([parseSearchTerm("mango"), parseSearchTerm("*mango"), parseSearchTerm("-mango")]);
  });
});

describe("sortSearchTermGroup", () => {
  test("orders terms by cost", () => {
    const term = parseSearchTerm("mango");
    const negatedTerm = parseSearchTerm("-mango");
    const wildcardTerm = parseSearchTerm("*mango");
    const wildcardNegatedTerm = parseSearchTerm("-*mango");
    const terms = [wildcardTerm, negatedTerm, term, wildcardNegatedTerm];

    expect(term.cost).toBeLessThan(wildcardTerm.cost);
    expect(sortSearchTermGroup(terms)).toStrictEqual([term, negatedTerm, wildcardTerm, wildcardNegatedTerm]);
  });
});

describe("normalizeSearchQuery", () => {
  function normalize(andTerms: string[], orGroups: string[][]): { andTerms: string[]; orGroups: string[][] } {
    const query = normalizeSearchQuery<Fruit>(buildSearchTermGroup(andTerms), orGroups.map(buildSearchTermGroup));
    return {
      andTerms: query.andTerms.map(term => term.literal),
      orGroups: query.orGroups.map(orGroup => orGroup.map(term => term.literal))
    };
  }

  test("dedupes and terms by literal", () => {
    expect(normalize(["apple", "apple", "banana"], [])).toEqual({ andTerms: ["apple", "banana"], orGroups: [] });
  });

  test("keeps a term distinct from its negation", () => {
    expect(normalize(["apple", "-apple"], [])).toEqual({ andTerms: ["apple", "-apple"], orGroups: [] });
  });

  test("dedupes terms within an or group", () => {
    expect(normalize([], [["apple", "apple", "banana"]])).toEqual({ andTerms: [], orGroups: [["apple", "banana"]] });
  });

  test("flattens an or group that dedupes down to one term into an and term", () => {
    expect(normalize([], [["apple", "apple"]])).toEqual({ andTerms: ["apple"], orGroups: [] });
  });

  test("flattens a singleton or group into and terms", () => {
    expect(normalize(["banana"], [["apple"]])).toEqual({ andTerms: ["banana", "apple"], orGroups: [] });
  });
});

describe("parseTermGroups", () => {
  function expectTermGroups(input: string, expectedOrGroups: string[][], expectedAndTerms: string[]): void {
    const result = parseTermGroups(input);

    expect(result.orGroups).toStrictEqual(expectedOrGroups);
    expect(result.andTerms).toStrictEqual(expectedAndTerms);
  }

  test("parses blank input to no terms", () => {
    expectTermGroups("", [], []);
    expectTermGroups(" ", [], []);
    expectTermGroups("\n", [], []);
    expectTermGroups("\t", [], []);
  });

  test("parses and terms", () => {
    expectTermGroups("grape", [], ["grape"]);
    expectTermGroups("cherry banana", [], ["cherry", "banana"]);
    expectTermGroups("apple orange", [], ["apple", "orange"]);
    expectTermGroups("apple orange grape", [], ["apple", "orange", "grape"]);
  });

  test("keeps parentheses inside a term", () => {
    expectTermGroups("apple_(red)", [], ["apple_(red)"]);
    expectTermGroups("apple_(red) banana", [], ["apple_(red)", "banana"]);
    expectTermGroups("apple_(red) banana_(yellow)", [], ["apple_(red)", "banana_(yellow)"]);
    expectTermGroups("apple_(red) banana_(yellow) grape", [], ["apple_(red)", "banana_(yellow)", "grape"]);
  });

  test("parses or groups", () => {
    expectTermGroups("( apple )", [["apple"]], []);
    expectTermGroups("( apple ) ( banana )", [["apple"], ["banana"]], []);
    expectTermGroups("( -apple ) ( banana ) ( -grape )", [["-apple"], ["banana"], ["-grape"]], []);
    expectTermGroups("( apple ~ banana )", [["apple", "banana"]], []);
  });

  test("parses malformed groups as and terms", () => {
    expectTermGroups("(apple )", [], ["(apple", ")"]);
    expectTermGroups("( apple", [], ["(", "apple"]);
    expectTermGroups("apple )", [], ["apple", ")"]);
    expectTermGroups("apple (", [], ["apple", "("]);
    expectTermGroups("(apple)", [], ["(apple)"]);
  });

  test("parses and terms mixed with or groups", () => {
    expectTermGroups("apple ( banana )", [["banana"]], ["apple"]);
    expectTermGroups("apple ( banana ) grape", [["banana"]], ["apple", "grape"]);
    expectTermGroups("apple ( banana ) grape ( orange )", [["banana"], ["orange"]], ["apple", "grape"]);
    expectTermGroups("apple ( banana ~ cherry ~ lime ) grape ( orange ) kiwi", [["banana", "cherry", "lime"], ["orange"]], ["apple", "grape", "kiwi"]);
  });

  test("parses a negated group as and terms", () => {
    expectTermGroups("-( apple )", [], ["-(", "apple", ")"]);
  });

  test("ignores extra spaces", () => {
    expectTermGroups("  apple  ( banana )  grape  ", [["banana"]], ["apple", "grape"]);
    expectTermGroups("  apple ( banana ) grape ( orange )  ", [["banana"], ["orange"]], ["apple", "grape"]);
    expectTermGroups("  apple ( banana ~ cherry ~ lime ) grape ( orange ) kiwi  ", [["banana", "cherry", "lime"], ["orange"]], ["apple", "grape", "kiwi"]);
    expectTermGroups(" apple                  banana    ( cherry )", [["cherry"]], ["apple", "banana"]);
  });
});

describe("parseSearchQuery", () => {
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

    expect(searchQuery.andTerms).toEqual([]);
    expect(searchQuery.orGroups).toEqual([]);
  });
});
