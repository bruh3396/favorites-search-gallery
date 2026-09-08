import { Searchable, SearchableMetric } from "@/types/search";
import { describe, expect, test } from "vitest";
import { parseMetricSearchTerm } from "@/lib/search/query/parsers/search_term_parser";

type MetricSearchable = Searchable & { getMetric: (metric: SearchableMetric) => number };

function createMetricSearchable(metrics: Partial<Record<SearchableMetric, number>>): MetricSearchable {
  const values: Record<SearchableMetric, number> = {
    score: 0,
    width: 0,
    height: 0,
    id: 0,
    duration: 0,
    ...metrics
  };
  return {
    tags: new Set(),
    getMetric: (metric): number => values[metric]
  };
}

const hd = createMetricSearchable({ width: 1920, height: 1080, score: 50, id: 1000, duration: 120 });
const sd = createMetricSearchable({ width: 1280, height: 720, score: 25, id: 500, duration: 60 });
const square = createMetricSearchable({ width: 1080, height: 1080, score: 100, id: 9999999, duration: 0 });

describe("MetricSearchTerm", () => {
  describe("equals operator (:)", () => {
    test("matches exact value", () => {
      expect(parseMetricSearchTerm("width:1920").matches(hd)).toBe(true);
      expect(parseMetricSearchTerm("height:1080").matches(hd)).toBe(true);
      expect(parseMetricSearchTerm("score:50").matches(hd)).toBe(true);
      expect(parseMetricSearchTerm("id:1000").matches(hd)).toBe(true);
      expect(parseMetricSearchTerm("duration:120").matches(hd)).toBe(true);
    });

    test("does not match different value", () => {
      expect(parseMetricSearchTerm("width:1280").matches(hd)).toBe(false);
      expect(parseMetricSearchTerm("height:720").matches(hd)).toBe(false);
      expect(parseMetricSearchTerm("score:25").matches(hd)).toBe(false);
    });

    test("negated equals", () => {
      expect(parseMetricSearchTerm("-width:1920").matches(hd)).toBe(false);
      expect(parseMetricSearchTerm("-width:1280").matches(hd)).toBe(true);
    });
  });

  describe("greater than operator (:>)", () => {
    test("matches when metric is greater", () => {
      expect(parseMetricSearchTerm("score:>25").matches(hd)).toBe(true);
      expect(parseMetricSearchTerm("width:>1280").matches(hd)).toBe(true);
      expect(parseMetricSearchTerm("id:>999").matches(hd)).toBe(true);
    });

    test("does not match when metric is equal or less", () => {
      expect(parseMetricSearchTerm("score:>50").matches(hd)).toBe(false);
      expect(parseMetricSearchTerm("score:>100").matches(hd)).toBe(false);
    });

    test("negated greater than", () => {
      expect(parseMetricSearchTerm("-score:>25").matches(hd)).toBe(false);
      expect(parseMetricSearchTerm("-score:>100").matches(hd)).toBe(true);
    });
  });

  describe("less than operator (:<)", () => {
    test("matches when metric is less", () => {
      expect(parseMetricSearchTerm("score:<100").matches(hd)).toBe(true);
      expect(parseMetricSearchTerm("width:<1920").matches(sd)).toBe(true);
      expect(parseMetricSearchTerm("id:<9999999").matches(hd)).toBe(true);
    });

    test("does not match when metric is equal or greater", () => {
      expect(parseMetricSearchTerm("score:<50").matches(hd)).toBe(false);
      expect(parseMetricSearchTerm("score:<25").matches(hd)).toBe(false);
    });

    test("negated less than", () => {
      expect(parseMetricSearchTerm("-score:<100").matches(hd)).toBe(false);
      expect(parseMetricSearchTerm("-score:<25").matches(hd)).toBe(true);
    });
  });

  describe("right hand metric comparison", () => {
    test("equals metric", () => {
      expect(parseMetricSearchTerm("width:height").matches(square)).toBe(true);
      expect(parseMetricSearchTerm("width:height").matches(hd)).toBe(false);
    });

    test("greater than metric", () => {
      expect(parseMetricSearchTerm("width:>height").matches(hd)).toBe(true);
      expect(parseMetricSearchTerm("width:>height").matches(square)).toBe(false);
    });

    test("less than metric", () => {
      expect(parseMetricSearchTerm("height:<width").matches(sd)).toBe(true);
      expect(parseMetricSearchTerm("duration:<score").matches(hd)).toBe(false);
    });

    test("negated metric comparison", () => {
      expect(parseMetricSearchTerm("-width:height").matches(square)).toBe(false);
      expect(parseMetricSearchTerm("-width:height").matches(hd)).toBe(true);
    });
  });

  describe("tautological comparison", () => {
    test("flags a self-comparison and leaves other comparisons unflagged", () => {
      expect(parseMetricSearchTerm("width:width").comparison.isTautological).toBe(true);
      expect(parseMetricSearchTerm("width:>width").comparison.isTautological).toBe(true);
      expect(parseMetricSearchTerm("width:height").comparison.isTautological).toBe(false);
      expect(parseMetricSearchTerm("width:100").comparison.isTautological).toBe(false);
    });
  });

  describe("invalid comparisons", () => {
    test("invalid metric defaults gracefully", () => {
      expect(() => parseMetricSearchTerm("invalid:100").matches(hd)).not.toThrow();
    });

    test("invalid operator defaults gracefully", () => {
      expect(() => parseMetricSearchTerm("width::100").matches(hd)).not.toThrow();
    });
  });

  describe("edge cases", () => {
    test("zero value", () => {
      expect(parseMetricSearchTerm("duration:0").matches(square)).toBe(true);
      expect(parseMetricSearchTerm("duration:0").matches(hd)).toBe(false);
    });

    test("large id value", () => {
      expect(parseMetricSearchTerm("id:9999999").matches(square)).toBe(true);
      expect(parseMetricSearchTerm("id:<9999999").matches(hd)).toBe(true);
    });
  });
});
