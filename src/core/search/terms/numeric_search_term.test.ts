import { MetricSearchable } from "@/core/search/searchable";
import { Metric } from "@/core/domain/post/post";
import { describe, expect, test } from "vitest";
import { parseNumericSearchTerm } from "@/core/search/parsers/search_term_parser";

function createDoc(id: number, tags: string[] = []): MetricSearchable {
  const values: Record<Metric, number> = {
    score: 0,
    width: 0,
    height: 0,
    id,
    duration: 0,
    changedAt: 0
  };
  return {
    tags: new Set(tags),
    getMetric: (metric): number => values[metric]
  };
}

describe("NumericSearchTerm", () => {
  describe("matches", () => {
    test("matches a post whose id equals the number", () => {
      expect(parseNumericSearchTerm("200").matches(createDoc(200))).toBe(true);
    });

    test("matches a post tagged with the number literally", () => {
      expect(parseNumericSearchTerm("200").matches(createDoc(1, ["200"]))).toBe(true);
    });

    test("matches when both the id and the tag agree", () => {
      expect(parseNumericSearchTerm("200").matches(createDoc(200, ["200"]))).toBe(true);
    });

    test("rejects a post when neither the id nor a tag equals the number", () => {
      expect(parseNumericSearchTerm("200").matches(createDoc(1, ["red", "blue"]))).toBe(false);
    });

    test("rejects a different id with no matching tag", () => {
      expect(parseNumericSearchTerm("200").matches(createDoc(201))).toBe(false);
    });

    test("excludes a post whose id equals the number when negated", () => {
      expect(parseNumericSearchTerm("-200").matches(createDoc(200))).toBe(false);
    });

    test("excludes a post tagged with the number literally when negated", () => {
      expect(parseNumericSearchTerm("-200").matches(createDoc(1, ["200"]))).toBe(false);
    });

    test("matches a post with neither the id nor the tag when negated", () => {
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
