import { buildSearchTermGroup, normalizeSearchQuery, parseSearchQuery, parseTermGroups, sortSearchTermGroup } from "@/lib/search/parsers/search_term_group_parser";
import { describe, expect, test } from "vitest";
import { Fruit } from "@/lib/search/testing/fruit_corpus";
import { parseSearchTerm } from "@/lib/search/parsers/search_term_parser";

function serializeQuery(query: string): string {
  const searchQuery = parseSearchQuery<Fruit>(query);
  return JSON.stringify({ orGroups: searchQuery.orGroups, andTerms: searchQuery.andTerms });
}

function testEquality(query1: string, query2: string): void {
  expect(serializeQuery(query1)).toBe(serializeQuery(query2));
}

function testInequality(query1: string, query2: string): void {
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
    expect(normalize(["cat", "cat", "dog"], [])).toEqual({ andTerms: ["cat", "dog"], orGroups: [] });
  });

  test("keeps a term distinct from its negation", () => {
    expect(normalize(["cat", "-cat"], [])).toEqual({ andTerms: ["cat", "-cat"], orGroups: [] });
  });

  test("dedupes terms within an or group", () => {
    expect(normalize([], [["cat", "cat", "dog"]])).toEqual({ andTerms: [], orGroups: [["cat", "dog"]] });
  });

  test("an or group that dedupes down to one term flattens to an and term", () => {
    expect(normalize([], [["cat", "cat"]])).toEqual({ andTerms: ["cat"], orGroups: [] });
  });

  test("flattens a singleton or group into and terms", () => {
    expect(normalize(["dog"], [["cat"]])).toEqual({ andTerms: ["dog", "cat"], orGroups: [] });
  });
});

describe("parseTermGroups", () => {
  function testTermGroups(input: string, expectedOrGroups: string[][], expectedAndTerms: string[]): void {
    const result = parseTermGroups(input);

    expect(result.orGroups).toStrictEqual(expectedOrGroups);
    expect(result.andTerms).toStrictEqual(expectedAndTerms);
  }

  test("empty", () => {
    testTermGroups("", [], []);
    testTermGroups(" ", [], []);
    testTermGroups("\n", [], []);
    testTermGroups("\t", [], []);
  });

  test("only and terms", () => {
    testTermGroups("grape", [], ["grape"]);
    testTermGroups("cherry banana", [], ["cherry", "banana"]);
    testTermGroups("apple orange", [], ["apple", "orange"]);
    testTermGroups("apple orange grape", [], ["apple", "orange", "grape"]);
  });

  test("parenthesis", () => {
    testTermGroups("apple_(red)", [], ["apple_(red)"]);
    testTermGroups("apple_(red) banana", [], ["apple_(red)", "banana"]);
    testTermGroups("apple_(red) banana_(yellow)", [], ["apple_(red)", "banana_(yellow)"]);
    testTermGroups("apple_(red) banana_(yellow) grape", [], ["apple_(red)", "banana_(yellow)", "grape"]);
  });

  test("only groups", () => {
    testTermGroups("( apple )", [["apple"]], []);
    testTermGroups("( apple ) ( banana )", [["apple"], ["banana"]], []);
    testTermGroups("( -apple ) ( banana ) ( -grape )", [["-apple"], ["banana"], ["-grape"]], []);
    testTermGroups("( apple ~ banana )", [["apple", "banana"]], []);
  });

  test("only invalid groups", () => {
    testTermGroups("(apple )", [], ["(apple", ")"]);
    testTermGroups("( apple", [], ["(", "apple"]);
    testTermGroups("apple )", [], ["apple", ")"]);
    testTermGroups("apple (", [], ["apple", "("]);
    testTermGroups("(apple)", [], ["(apple)"]);
  });

  test("both groups", () => {
    testTermGroups("apple ( banana )", [["banana"]], ["apple"]);
    testTermGroups("apple ( banana ) grape", [["banana"]], ["apple", "grape"]);
    testTermGroups("apple ( banana ) grape ( orange )", [["banana"], ["orange"]], ["apple", "grape"]);
    testTermGroups("apple ( banana ~ cherry ~ lime ) grape ( orange ) kiwi", [["banana", "cherry", "lime"], ["orange"]], ["apple", "grape", "kiwi"]);
  });

  test("negated group", () => {
    testTermGroups("-( apple )", [], ["-(", "apple", ")"]);
  });

  test("extra spaces", () => {
    testTermGroups("  apple  ( banana )  grape  ", [["banana"]], ["apple", "grape"]);
    testTermGroups("  apple ( banana ) grape ( orange )  ", [["banana"], ["orange"]], ["apple", "grape"]);
    testTermGroups("  apple ( banana ~ cherry ~ lime ) grape ( orange ) kiwi  ", [["banana", "cherry", "lime"], ["orange"]], ["apple", "grape", "kiwi"]);
    testTermGroups(" apple                  banana    ( cherry )", [["cherry"]], ["apple", "banana"]);
  });
});

describe("equality", () => {
  test("order", () => {
    testEquality("apple ( banana ~ cherry )", "( banana ~ cherry ) apple");
  });

  test("duplicates in or groups", () => {
    testEquality("apple ( banana ~ cherry )", "( banana ~ cherry ~ cherry ) apple");
  });

  test("sort or groups by length", () => {
    testEquality("apple ( banana ~ cherry ~ pear ) ( grape ~ orange )", "apple ( grape ~ orange ) ( banana ~ cherry ~ pear )");
    testInequality("apple ( grape ~ orange ) ( banana ~ cherry )", "apple  ( banana ~ cherry ) ( grape ~ orange )");
  });

  test("simplify or groups of length 1", () => {
    testEquality("-apple ( banana )", "banana -apple");
    testEquality("-apple ( banana* ) ( cherry )", "cherry -apple banana*");
  });

  test("equal", () => {
    testEquality("apple", "apple");
    testEquality("apple", "apple   ");
    testEquality("  apple", "apple   ");
    testEquality("", "");
  });

  test("not equal", () => {
    testInequality("apple", "banana");
    testInequality("apple sweet", "apple");
    testInequality("( apple ~ banana )", "( apple ~ cherry )");
    testInequality("apple -sweet", "apple sweet");
    testInequality("app*", "apple");
  });
});

describe("andTerms", () => {
  test("an asterisk only query has no terms", () => {
    const searchQuery = parseSearchQuery<Fruit>("*");

    expect(searchQuery.andTerms).toEqual([]);
    expect(searchQuery.orGroups).toEqual([]);
  });
});
