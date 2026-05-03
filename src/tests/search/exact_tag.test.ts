import { describe, expect, test } from "vitest";
import { searchableEmptyDoc, searchableFruitDoc } from "./fruit_search_fixtures";
import { parseExactTag } from "../../lib/search/parse/tag_parser";

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
    expect(parseExactTag("").matches(searchableFruitDoc)).toBe(false);
  });

  test("cost", () => {
    expect(parseExactTag("foo").cost).toBeLessThan(parseExactTag("-foo").cost);
  });

  test.each(positiveCases)("matches %s", (tag, expected) => {
    expect(parseExactTag(tag).matches(searchableFruitDoc)).toBe(expected);
  });

  test.each(negatedCases)("negated %s", (tag, expected) => {
    expect(parseExactTag(tag).matches(searchableFruitDoc)).toBe(expected);
  });

  test.each(invalidCases)("invalid '%s'", (tag, expected) => {
    expect(parseExactTag(tag).matches(searchableEmptyDoc)).toBe(expected);
  });

  test("negated matches with empty set", () => {
    expect(parseExactTag("-banana").matches(searchableEmptyDoc)).toBe(true);
  });
});
