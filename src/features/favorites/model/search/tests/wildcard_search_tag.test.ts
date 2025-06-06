import { FRUITS, SEARCHABLE_EMPTY, SEARCHABLE_FRUITS, SEARCHABLE_SORTED_FRUITS, SORTED_FRUITS, createSearchable, getAllSubstrings, getPrefixes } from "./test_utils";
import { describe, expect, test } from "vitest";
import { WildcardSearchTag } from "../search_tags/wildcard_search_tag";

describe("wildcardSearchTag", () => {
  test("empty", () => {
    expect(new WildcardSearchTag("*").matches(SEARCHABLE_EMPTY)).toBe(false);
  });

  test("empty negated", () => {
    expect(new WildcardSearchTag("-*").matches(SEARCHABLE_EMPTY)).toBe(true);
  });

  test("one tag", () => {
    expect(new WildcardSearchTag("*").matches(createSearchable(["apple"]))).toBe(true);
  });

  test("match all", () => {
    expect(new WildcardSearchTag("*").matches(SEARCHABLE_FRUITS)).toBe(true);
  });

  test("match none", () => {
    expect(new WildcardSearchTag("-*").matches(SEARCHABLE_FRUITS)).toBe(false);
  });

  test("matches prefix", () => {
    for (const fruit of SORTED_FRUITS) {
      for (const prefix of getPrefixes(fruit)) {
        expect(new WildcardSearchTag(`${prefix}*`).matches(SEARCHABLE_SORTED_FRUITS)).toBe(true);
      }
    }
  });

  test("matches double asterisk", () => {
    for (const fruit of FRUITS) {
      for (const substring of getAllSubstrings(fruit)) {
        expect(new WildcardSearchTag(`*${substring}*`).matches(SEARCHABLE_FRUITS)).toBe(true);
        expect(new WildcardSearchTag(`**${substring}*`).matches(SEARCHABLE_FRUITS)).toBe(true);
        expect(new WildcardSearchTag(`**${substring}***`).matches(SEARCHABLE_FRUITS)).toBe(true);
        expect(new WildcardSearchTag(`*${substring}_NO_MATCH_*`).matches(SEARCHABLE_FRUITS)).toBe(false);
      }
    }
  });

  test("matches inside", () => {
    expect(new WildcardSearchTag("*b*na*").matches(SEARCHABLE_FRUITS)).toBe(true);
    expect(new WildcardSearchTag("*b*a*").matches(SEARCHABLE_SORTED_FRUITS)).toBe(true);
    expect(new WildcardSearchTag("*bna*").matches(SEARCHABLE_SORTED_FRUITS)).toBe(false);
  });

  test("compare cost", () => {
    const startsWithTag = new WildcardSearchTag("banana*");
    const containsTag = new WildcardSearchTag("*bana*");
    const containsTag2 = new WildcardSearchTag("*bana*****");
    const endsWithTag = new WildcardSearchTag("*banana");
    const wildcardTag = new WildcardSearchTag("*b*a*");

    expect(startsWithTag.finalCost).toBeLessThan(containsTag.finalCost);
    expect(startsWithTag.finalCost).toBeLessThan(endsWithTag.finalCost);
    expect(startsWithTag.finalCost).toBeLessThan(wildcardTag.finalCost);

    expect(containsTag.finalCost).toBeLessThan(endsWithTag.finalCost);
    expect(containsTag.finalCost).toBeLessThan(wildcardTag.finalCost);
    expect(containsTag.finalCost).toBe(containsTag2.finalCost);

    expect(endsWithTag.finalCost).toBe(wildcardTag.finalCost);
  });

  // test("compare performance", () => {
  //   function measureExecutionTime(searchTag: WildcardSearchTag, iterations: number): number {
  //     const start = performance.now();

  //     for (let i = 0; i < iterations; i += 1) {
  //       searchTag.matches(SEARCHABLE_SORTED_FRUITS);
  //     }
  //     return performance.now() - start;
  //   }

  //   const startsWithTag = new WildcardSearchTag("banana*");
  //   const containsTag = new WildcardSearchTag("*banana*");
  //   const wildcardTag = new WildcardSearchTag("*ban*ana*");

  //   expect(startsWithTag.matches(SEARCHABLE_SORTED_FRUITS)).toBe(true);
  //   expect(containsTag.matches(SEARCHABLE_SORTED_FRUITS)).toBe(true);
  //   expect(wildcardTag.matches(SEARCHABLE_SORTED_FRUITS)).toBe(true);

  //   const iterations = 5000;
  //   const startsWithTime = measureExecutionTime(startsWithTag, iterations);
  //   const containsTime = measureExecutionTime(containsTag, iterations);
  //   const wildcardTime = measureExecutionTime(wildcardTag, iterations);
  //   const wildcardThreshold = 0.8;

  //   expect(startsWithTime).toBeLessThan(wildcardTime * wildcardThreshold);
  //   expect(containsTime).toBeLessThan(wildcardTime * wildcardThreshold);
  // });
});
