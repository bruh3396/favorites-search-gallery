import { describe, expect, test } from "vitest";
import { searchableEmptyDoc, searchableFruitDoc } from "@/lib/search/fruit_search_fixture";
import { parseExactSearchTerm } from "@/lib/search/parsers/search_term_parser";

const positiveCases = [
  ["banana", true],
  ["kiwi", true],
  ["grape", true],
  ["apple", true],
  ["orange", true],
  ["mango", true],
  ["rose", false],
  ["tulip", false],
  ["daisy", false],
  ["lily", false],
  ["orchid", false],
  ["sunflower", false]
] as const;

const negatedCases = [
  ["-banana", false],
  ["-kiwi", false],
  ["-grape", false],
  ["-apple", false],
  ["-orange", false],
  ["-mango", false],
  ["-rose", true],
  ["-tulip", true],
  ["-daisy", true],
  ["-lily", true],
  ["-orchid", true],
  ["-sunflower", true]
] as const;

const invalidCases = [
  [" ", false],
  ["   ", false],
  ["a", false]
] as const;

describe("ExactSearchTerm", () => {
  test("empty", () => {
    expect(parseExactSearchTerm("").matches(searchableFruitDoc)).toBe(false);
  });

  test("cost", () => {
    expect(parseExactSearchTerm("foo").cost).toBeLessThan(parseExactSearchTerm("-foo").cost);
  });

  test.each(positiveCases)("matches %s", (term, expected) => {
    expect(parseExactSearchTerm(term).matches(searchableFruitDoc)).toBe(expected);
  });

  test.each(negatedCases)("negated %s", (term, expected) => {
    expect(parseExactSearchTerm(term).matches(searchableFruitDoc)).toBe(expected);
  });

  test.each(invalidCases)("invalid '%s'", (term, expected) => {
    expect(parseExactSearchTerm(term).matches(searchableEmptyDoc)).toBe(expected);
  });

  test("negated matches with empty set", () => {
    expect(parseExactSearchTerm("-banana").matches(searchableEmptyDoc)).toBe(true);
  });
});
