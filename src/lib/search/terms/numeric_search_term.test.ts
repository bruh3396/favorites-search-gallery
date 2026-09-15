import { MetricSearchable, SearchableMetric } from "@/types/search";
import { describe, expect, test } from "vitest";
import { parseNumericSearchTerm } from "@/lib/search/parsers/search_term_parser";

function createDoc(id: number, tags: string[] = []): MetricSearchable {
  const values: Record<SearchableMetric, number> = {
    score: 0,
    width: 0,
    height: 0,
    id,
    duration: 0
  };
  return {
    tags: new Set(tags),
    getMetric: (metric): number => values[metric]
  };
}

describe("NumericSearchTerm", () => {
  describe("positive", () => {
    test("matches a post whose id equals the number", () => {
      expect(parseNumericSearchTerm("200").matches(createDoc(200))).toBe(true);
    });

    test("matches a post tagged with the number literally", () => {
      expect(parseNumericSearchTerm("200").matches(createDoc(1, ["200"]))).toBe(true);
    });

    test("matches when both the id and the tag agree", () => {
      expect(parseNumericSearchTerm("200").matches(createDoc(200, ["200"]))).toBe(true);
    });

    test("does not match when neither the id nor a tag equals the number", () => {
      expect(parseNumericSearchTerm("200").matches(createDoc(1, ["red", "blue"]))).toBe(false);
    });

    test("does not match a different id with no matching tag", () => {
      expect(parseNumericSearchTerm("200").matches(createDoc(201))).toBe(false);
    });
  });

  describe("negated", () => {
    test("excludes a post whose id equals the number", () => {
      expect(parseNumericSearchTerm("-200").matches(createDoc(200))).toBe(false);
    });

    test("excludes a post tagged with the number literally", () => {
      expect(parseNumericSearchTerm("-200").matches(createDoc(1, ["200"]))).toBe(false);
    });

    test("matches a post with neither the id nor the tag", () => {
      expect(parseNumericSearchTerm("-200").matches(createDoc(1, ["red"]))).toBe(true);
    });
  });

  describe("literal", () => {
    test("preserves the raw value", () => {
      expect(parseNumericSearchTerm("200").literal).toBe("200");
    });

    test("preserves the negation marker", () => {
      expect(parseNumericSearchTerm("-200").literal).toBe("-200");
    });
  });
});
