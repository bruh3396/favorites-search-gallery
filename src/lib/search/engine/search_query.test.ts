import { Fruit, FruitName, fruitDocs } from "@/lib/search/testing/fruit_corpus";
import { describe, expect, test } from "vitest";
import { SearchQuery } from "@/lib/search/engine/search_query";
import { searchCases } from "@/lib/search/testing/search_cases";

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

describe("requiredTerms", () => {
  test("collects positive and terms", () => {
    expect(new SearchQuery<Fruit>("red sweet").requiredTerms.sort()).toEqual(["red", "sweet"]);
  });

  test("excludes negated terms", () => {
    expect(new SearchQuery<Fruit>("red -sweet").requiredTerms).toEqual(["red"]);
  });

  test("includes flattened singleton or groups", () => {
    expect(new SearchQuery<Fruit>("-apple ( banana )").requiredTerms).toEqual(["banana"]);
  });

  test("excludes multi term or groups", () => {
    expect(new SearchQuery<Fruit>("red ( banana ~ cherry )").requiredTerms).toEqual(["red"]);
  });

  test("empty query has no required terms", () => {
    expect(new SearchQuery<Fruit>("").requiredTerms).toEqual([]);
  });
});

describe("negatedTerms", () => {
  test("collects negated and terms", () => {
    expect(new SearchQuery<Fruit>("red -sweet -berry").negatedTerms).toEqual(new Set(["sweet", "berry"]));
  });

  test("excludes positive terms", () => {
    expect(new SearchQuery<Fruit>("red sweet").negatedTerms).toEqual(new Set());
  });

  test("excludes multi term or groups", () => {
    expect(new SearchQuery<Fruit>("-red ( banana ~ cherry )").negatedTerms).toEqual(new Set(["red"]));
  });

  test("empty query has no negated terms", () => {
    expect(new SearchQuery<Fruit>("").negatedTerms).toEqual(new Set());
  });
});

describe("hasOnlyExactTerms", () => {
  test("true when every term is exact", () => {
    expect(new SearchQuery<Fruit>("red sweet").hasOnlyExactTerms).toBe(true);
  });

  test("true for negated exact terms", () => {
    expect(new SearchQuery<Fruit>("red -sweet").hasOnlyExactTerms).toBe(true);
  });

  test("true when exact terms appear in or groups", () => {
    expect(new SearchQuery<Fruit>("red ( banana ~ cherry )").hasOnlyExactTerms).toBe(true);
  });

  test("false when an and term is a wildcard", () => {
    expect(new SearchQuery<Fruit>("red be*").hasOnlyExactTerms).toBe(false);
  });

  test("false when an or group term is a wildcard", () => {
    expect(new SearchQuery<Fruit>("red ( banana ~ ch* )").hasOnlyExactTerms).toBe(false);
  });

  test("empty query has only exact terms", () => {
    expect(new SearchQuery<Fruit>("").hasOnlyExactTerms).toBe(true);
  });
});

describe("hasMetadataTerm", () => {
  test("true when an and term is a metadata term", () => {
    expect(new SearchQuery<Fruit>("red score:>15").hasMetadataTerm).toBe(true);
  });

  test("true when an or group term is a metadata term", () => {
    expect(new SearchQuery<Fruit>("red ( banana ~ score:>15 )").hasMetadataTerm).toBe(true);
  });

  test("true for a negated metadata term", () => {
    expect(new SearchQuery<Fruit>("-score:>15").hasMetadataTerm).toBe(true);
  });

  test("false when no term is a metadata term", () => {
    expect(new SearchQuery<Fruit>("red ( banana ~ ch* )").hasMetadataTerm).toBe(false);
  });

  test("empty query has no metadata term", () => {
    expect(new SearchQuery<Fruit>("").hasMetadataTerm).toBe(false);
  });
});
