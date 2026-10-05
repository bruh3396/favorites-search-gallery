import { describe, expect, test } from "vitest";
import { Metric } from "@/core/domain/post/post";
import { Searchable } from "@/core/search/searchable";
import { parseMetricSearchTerm } from "@/core/search/parsers/search_term_parser";

type MetricSearchable = Searchable & { getMetric: (metric: Metric) => number };

function createMetricSearchable(metrics: Partial<Record<Metric, number>>): MetricSearchable {
  const values: Record<Metric, number> = {
    score: 0,
    width: 0,
    height: 0,
    id: 0,
    duration: 0,
    changedAt: 0,
    ...metrics
  };
  return {
    tags: new Set(),
    getMetric: (metric): number => values[metric]
  };
}

const hd = createMetricSearchable({ width: 1_920, height: 1_080, score: 50, id: 1_000, duration: 120 });
const sd = createMetricSearchable({ width: 1_280, height: 720, score: 25, id: 500, duration: 60 });
const square = createMetricSearchable({ width: 1_080, height: 1_080, score: 100, id: 9_999_999, duration: 0 });

describe("MetricSearchTerm", () => {
  describe("matches", () => {
    test("matches an equal value through :", () => {
      expect(parseMetricSearchTerm("width:1920").matches(hd)).toBe(true);
      expect(parseMetricSearchTerm("height:1080").matches(hd)).toBe(true);
      expect(parseMetricSearchTerm("score:50").matches(hd)).toBe(true);
      expect(parseMetricSearchTerm("id:1000").matches(hd)).toBe(true);
      expect(parseMetricSearchTerm("duration:120").matches(hd)).toBe(true);
    });

    test("rejects a different value through :", () => {
      expect(parseMetricSearchTerm("width:1280").matches(hd)).toBe(false);
      expect(parseMetricSearchTerm("height:720").matches(hd)).toBe(false);
      expect(parseMetricSearchTerm("score:25").matches(hd)).toBe(false);
    });

    test("inverts : when negated", () => {
      expect(parseMetricSearchTerm("-width:1920").matches(hd)).toBe(false);
      expect(parseMetricSearchTerm("-width:1280").matches(hd)).toBe(true);
    });

    test("matches a greater metric through :>", () => {
      expect(parseMetricSearchTerm("score:>25").matches(hd)).toBe(true);
      expect(parseMetricSearchTerm("width:>1280").matches(hd)).toBe(true);
      expect(parseMetricSearchTerm("id:>999").matches(hd)).toBe(true);
    });

    test("rejects an equal or lesser metric through :>", () => {
      expect(parseMetricSearchTerm("score:>50").matches(hd)).toBe(false);
      expect(parseMetricSearchTerm("score:>100").matches(hd)).toBe(false);
    });

    test("inverts :> when negated", () => {
      expect(parseMetricSearchTerm("-score:>25").matches(hd)).toBe(false);
      expect(parseMetricSearchTerm("-score:>100").matches(hd)).toBe(true);
    });

    test("matches a lesser metric through :<", () => {
      expect(parseMetricSearchTerm("score:<100").matches(hd)).toBe(true);
      expect(parseMetricSearchTerm("width:<1920").matches(sd)).toBe(true);
      expect(parseMetricSearchTerm("id:<9999999").matches(hd)).toBe(true);
    });

    test("rejects an equal or greater metric through :<", () => {
      expect(parseMetricSearchTerm("score:<50").matches(hd)).toBe(false);
      expect(parseMetricSearchTerm("score:<25").matches(hd)).toBe(false);
    });

    test("inverts :< when negated", () => {
      expect(parseMetricSearchTerm("-score:<100").matches(hd)).toBe(false);
      expect(parseMetricSearchTerm("-score:<25").matches(hd)).toBe(true);
    });

    test("compares two metrics for equality", () => {
      expect(parseMetricSearchTerm("width:height").matches(square)).toBe(true);
      expect(parseMetricSearchTerm("width:height").matches(hd)).toBe(false);
    });

    test("compares one metric greater than another", () => {
      expect(parseMetricSearchTerm("width:>height").matches(hd)).toBe(true);
      expect(parseMetricSearchTerm("width:>height").matches(square)).toBe(false);
    });

    test("compares one metric less than another", () => {
      expect(parseMetricSearchTerm("height:<width").matches(sd)).toBe(true);
      expect(parseMetricSearchTerm("duration:<score").matches(hd)).toBe(false);
    });

    test("inverts a metric comparison when negated", () => {
      expect(parseMetricSearchTerm("-width:height").matches(square)).toBe(false);
      expect(parseMetricSearchTerm("-width:height").matches(hd)).toBe(true);
    });

    test("does not throw on an invalid metric", () => {
      expect(() => parseMetricSearchTerm("invalid:100").matches(hd)).not.toThrow();
    });

    test("does not throw on an invalid operator", () => {
      expect(() => parseMetricSearchTerm("width::100").matches(hd)).not.toThrow();
    });

    test("matches a zero value", () => {
      expect(parseMetricSearchTerm("duration:0").matches(square)).toBe(true);
      expect(parseMetricSearchTerm("duration:0").matches(hd)).toBe(false);
    });

    test("compares a large id", () => {
      expect(parseMetricSearchTerm("id:9999999").matches(square)).toBe(true);
      expect(parseMetricSearchTerm("id:<9999999").matches(hd)).toBe(true);
    });
  });

  describe("comparison", () => {
    test("flags a self-comparison as tautological and leaves other comparisons unflagged", () => {
      expect(parseMetricSearchTerm("width:width").comparison.isTautological).toBe(true);
      expect(parseMetricSearchTerm("width:>width").comparison.isTautological).toBe(true);
      expect(parseMetricSearchTerm("width:height").comparison.isTautological).toBe(false);
      expect(parseMetricSearchTerm("width:100").comparison.isTautological).toBe(false);
    });
  });
});
