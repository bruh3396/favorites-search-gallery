import { Fruit, FruitName, fruitDocs, searchCases } from "@/lib/search/fruit_search_fixture";
import { describe, expect, test } from "vitest";
import { SearchQuery } from "@/lib/search/query/search_query";

function serializeQuery(query: string): string {
  const searchQuery = new SearchQuery<Fruit>(query);
  return JSON.stringify({ orGroups: searchQuery.orGroups, andTerms: searchQuery.andTerms });
}

function testQuery(query: string, expectedNames: FruitName[]): void {
  const expected = expectedNames.slice().sort();
  const actual = new SearchQuery<Fruit>(query).filter(fruitDocs).map(item => item.name).sort();

  expect(actual, query).toEqual(expected);
}

function testEquality(query1: string, query2: string): void {
  expect(serializeQuery(query1)).toBe(serializeQuery(query2));
}

function testInequality(query1: string, query2: string): void {
  expect(serializeQuery(query1)).not.toBe(serializeQuery(query2));
}

describe("filter", () => {
  for (const group of searchCases) {
    test(group.name, () => {
      group.run(testQuery);
    });
  }
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
