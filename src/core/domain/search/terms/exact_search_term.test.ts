import { describe, expect, test } from "vitest";
import { parseExactSearchTerm } from "@/core/domain/search/parsers/search_term_parser";
import { buildSearchable } from "@/core/domain/search/testing/searchable_builder";
import { FRUIT_VOCABULARY } from "@/core/domain/search/testing/fruit_vocabulary";

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
  test("rejects an empty term", () => {
    expect(parseExactSearchTerm("").matches(FRUIT_VOCABULARY)).toBe(false);
  });

  test("costs less than its negated form", () => {
    expect(parseExactSearchTerm("apple").cost).toBeLessThan(parseExactSearchTerm("-apple").cost);
  });

  test.each(positiveCases)("matches %s against the fruit doc", (term, expected) => {
    expect(parseExactSearchTerm(term).matches(FRUIT_VOCABULARY)).toBe(expected);
  });

  test.each(negatedCases)("inverts the match for %s", (term, expected) => {
    expect(parseExactSearchTerm(term).matches(FRUIT_VOCABULARY)).toBe(expected);
  });

  test.each(invalidCases)("rejects the invalid term '%s'", (term, expected) => {
    expect(parseExactSearchTerm(term).matches(buildSearchable([]))).toBe(expected);
  });

  test("matches a doc with no tags when negated", () => {
    expect(parseExactSearchTerm("-banana").matches(buildSearchable([]))).toBe(true);
  });
});
