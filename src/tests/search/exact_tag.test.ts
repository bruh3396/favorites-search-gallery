import { describe, expect, test } from "vitest";
import { searchableEmptyDoc, searchableFruitDoc } from "./fruit_search_fixtures";
import { parseExactSearchTerm } from "../../lib/search/parse/search_term_parser";

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

describe("exactTag", () => {
  test("empty", () => {
    expect(parseExactSearchTerm("").matches(searchableFruitDoc)).toBe(false);
  });

  test("cost", () => {
    expect(parseExactSearchTerm("foo").cost).toBeLessThan(parseExactSearchTerm("-foo").cost);
  });

  test.each(positiveCases)("matches %s", (tag, expected) => {
    expect(parseExactSearchTerm(tag).matches(searchableFruitDoc)).toBe(expected);
  });

  test.each(negatedCases)("negated %s", (tag, expected) => {
    expect(parseExactSearchTerm(tag).matches(searchableFruitDoc)).toBe(expected);
  });

  test.each(invalidCases)("invalid '%s'", (tag, expected) => {
    expect(parseExactSearchTerm(tag).matches(searchableEmptyDoc)).toBe(expected);
  });

  test("negated matches with empty set", () => {
    expect(parseExactSearchTerm("-banana").matches(searchableEmptyDoc)).toBe(true);
  });
});
