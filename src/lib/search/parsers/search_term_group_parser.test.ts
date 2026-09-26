import { buildSearchTermGroup, normalizeSearchQuery, parseSearchQuery, parseTermGroups, sortSearchTermGroup } from "@/lib/search/parsers/search_term_group_parser";
import { describe, expect, test } from "vitest";
import { Fruit } from "@/lib/search/testing/fruit_corpus";
import { parseSearchTerm } from "@/lib/search/parsers/search_term_parser";

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

describe("buildSearchTerms and sortSearchTerms", () => {
  test("buildSearchTerms parses each string to a term", () => {
    expect(buildSearchTermGroup(["mango", "*mango", "-mango"])).toStrictEqual([parseSearchTerm("mango"), parseSearchTerm("*mango"), parseSearchTerm("-mango")]);
  });

  test("sortSearchTerms", () => {
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

  test("an or group that dedupes down to one term flattens to an and term", () => {
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

  test("empty", () => {
    expectTermGroups("", [], []);
    expectTermGroups(" ", [], []);
    expectTermGroups("\n", [], []);
    expectTermGroups("\t", [], []);
  });

  test("only and terms", () => {
    expectTermGroups("grape", [], ["grape"]);
    expectTermGroups("cherry banana", [], ["cherry", "banana"]);
    expectTermGroups("apple orange", [], ["apple", "orange"]);
    expectTermGroups("apple orange grape", [], ["apple", "orange", "grape"]);
  });

  test("parenthesis", () => {
    expectTermGroups("apple_(red)", [], ["apple_(red)"]);
    expectTermGroups("apple_(red) banana", [], ["apple_(red)", "banana"]);
    expectTermGroups("apple_(red) banana_(yellow)", [], ["apple_(red)", "banana_(yellow)"]);
    expectTermGroups("apple_(red) banana_(yellow) grape", [], ["apple_(red)", "banana_(yellow)", "grape"]);
  });

  test("only groups", () => {
    expectTermGroups("( apple )", [["apple"]], []);
    expectTermGroups("( apple ) ( banana )", [["apple"], ["banana"]], []);
    expectTermGroups("( -apple ) ( banana ) ( -grape )", [["-apple"], ["banana"], ["-grape"]], []);
    expectTermGroups("( apple ~ banana )", [["apple", "banana"]], []);
  });

  test("only invalid groups", () => {
    expectTermGroups("(apple )", [], ["(apple", ")"]);
    expectTermGroups("( apple", [], ["(", "apple"]);
    expectTermGroups("apple )", [], ["apple", ")"]);
    expectTermGroups("apple (", [], ["apple", "("]);
    expectTermGroups("(apple)", [], ["(apple)"]);
  });

  test("both groups", () => {
    expectTermGroups("apple ( banana )", [["banana"]], ["apple"]);
    expectTermGroups("apple ( banana ) grape", [["banana"]], ["apple", "grape"]);
    expectTermGroups("apple ( banana ) grape ( orange )", [["banana"], ["orange"]], ["apple", "grape"]);
    expectTermGroups("apple ( banana ~ cherry ~ lime ) grape ( orange ) kiwi", [["banana", "cherry", "lime"], ["orange"]], ["apple", "grape", "kiwi"]);
  });

  test("negated group", () => {
    expectTermGroups("-( apple )", [], ["-(", "apple", ")"]);
  });

  test("extra spaces", () => {
    expectTermGroups("  apple  ( banana )  grape  ", [["banana"]], ["apple", "grape"]);
    expectTermGroups("  apple ( banana ) grape ( orange )  ", [["banana"], ["orange"]], ["apple", "grape"]);
    expectTermGroups("  apple ( banana ~ cherry ~ lime ) grape ( orange ) kiwi  ", [["banana", "cherry", "lime"], ["orange"]], ["apple", "grape", "kiwi"]);
    expectTermGroups(" apple                  banana    ( cherry )", [["cherry"]], ["apple", "banana"]);
  });
});

describe("equality", () => {
  test("order", () => {
    expectEquivalent("apple ( banana ~ cherry )", "( banana ~ cherry ) apple");
  });

  test("duplicates in or groups", () => {
    expectEquivalent("apple ( banana ~ cherry )", "( banana ~ cherry ~ cherry ) apple");
  });

  test("sort or groups by length", () => {
    expectEquivalent("apple ( banana ~ cherry ~ pear ) ( grape ~ orange )", "apple ( grape ~ orange ) ( banana ~ cherry ~ pear )");
    expectNotEquivalent("apple ( grape ~ orange ) ( banana ~ cherry )", "apple  ( banana ~ cherry ) ( grape ~ orange )");
  });

  test("simplify or groups of length 1", () => {
    expectEquivalent("-apple ( banana )", "banana -apple");
    expectEquivalent("-apple ( banana* ) ( cherry )", "cherry -apple banana*");
  });

  test("equal", () => {
    expectEquivalent("apple", "apple");
    expectEquivalent("apple", "apple   ");
    expectEquivalent("  apple", "apple   ");
    expectEquivalent("", "");
  });

  test("not equal", () => {
    expectNotEquivalent("apple", "banana");
    expectNotEquivalent("apple sweet", "apple");
    expectNotEquivalent("( apple ~ banana )", "( apple ~ cherry )");
    expectNotEquivalent("apple -sweet", "apple sweet");
    expectNotEquivalent("app*", "apple");
  });
});

describe("andTerms", () => {
  test("an asterisk only query has no terms", () => {
    const searchQuery = parseSearchQuery<Fruit>("*");

    expect(searchQuery.andTerms).toEqual([]);
    expect(searchQuery.orGroups).toEqual([]);
  });
});
