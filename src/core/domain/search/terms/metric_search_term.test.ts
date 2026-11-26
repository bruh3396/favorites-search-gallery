import { describe, expect, test } from "vitest";
import { parseMetricSearchTerm, parseSearchTerm } from "@/core/domain/search/parsers/search_term_parser";
import { Metric } from "@/core/domain/search/metric";
import { MetricSearchable } from "@/core/domain/search/metric_searchable";

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

const hdMetricSearchable = createMetricSearchable({ width: 1_920, height: 1_080, score: 50, id: 1_000, duration: 120 });
const sdMetricSearchable = createMetricSearchable({ width: 1_280, height: 720, score: 25, id: 500, duration: 60 });
const squareMetricSearchable = createMetricSearchable({ width: 1_080, height: 1_080, score: 100, id: 9_999_999, duration: 0 });

describe("MetricSearchTerm", () => {
  describe("matches", () => {
    test("matches an equal value through :", () => {
      expect(parseSearchTerm("width:1920").matches(hdMetricSearchable)).toBe(true);
      expect(parseSearchTerm("height:1080").matches(hdMetricSearchable)).toBe(true);
      expect(parseSearchTerm("score:50").matches(hdMetricSearchable)).toBe(true);
      expect(parseSearchTerm("id:1000").matches(hdMetricSearchable)).toBe(true);
      expect(parseSearchTerm("duration:120").matches(hdMetricSearchable)).toBe(true);
    });

    test("rejects a different value through :", () => {
      expect(parseSearchTerm("width:1280").matches(hdMetricSearchable)).toBe(false);
      expect(parseSearchTerm("height:720").matches(hdMetricSearchable)).toBe(false);
      expect(parseSearchTerm("score:25").matches(hdMetricSearchable)).toBe(false);
    });

    test("inverts : when negated", () => {
      expect(parseSearchTerm("-width:1920").matches(hdMetricSearchable)).toBe(false);
      expect(parseSearchTerm("-width:1280").matches(hdMetricSearchable)).toBe(true);
    });

    test("matches a greater metric through :>", () => {
      expect(parseSearchTerm("score:>25").matches(hdMetricSearchable)).toBe(true);
      expect(parseSearchTerm("width:>1280").matches(hdMetricSearchable)).toBe(true);
      expect(parseSearchTerm("id:>999").matches(hdMetricSearchable)).toBe(true);
    });

    test("rejects an equal or lesser metric through :>", () => {
      expect(parseSearchTerm("score:>50").matches(hdMetricSearchable)).toBe(false);
      expect(parseSearchTerm("score:>100").matches(hdMetricSearchable)).toBe(false);
    });

    test("inverts :> when negated", () => {
      expect(parseSearchTerm("-score:>25").matches(hdMetricSearchable)).toBe(false);
      expect(parseSearchTerm("-score:>100").matches(hdMetricSearchable)).toBe(true);
    });

    test("matches a lesser metric through :<", () => {
      expect(parseSearchTerm("score:<100").matches(hdMetricSearchable)).toBe(true);
      expect(parseSearchTerm("width:<1920").matches(sdMetricSearchable)).toBe(true);
      expect(parseSearchTerm("id:<9999999").matches(hdMetricSearchable)).toBe(true);
    });

    test("rejects an equal or greater metric through :<", () => {
      expect(parseSearchTerm("score:<50").matches(hdMetricSearchable)).toBe(false);
      expect(parseSearchTerm("score:<25").matches(hdMetricSearchable)).toBe(false);
    });

    test("inverts :< when negated", () => {
      expect(parseSearchTerm("-score:<100").matches(hdMetricSearchable)).toBe(false);
      expect(parseSearchTerm("-score:<25").matches(hdMetricSearchable)).toBe(true);
    });

    test("compares two metrics for equality", () => {
      expect(parseSearchTerm("width:height").matches(squareMetricSearchable)).toBe(true);
      expect(parseSearchTerm("width:height").matches(hdMetricSearchable)).toBe(false);
    });

    test("compares one metric greater than another", () => {
      expect(parseSearchTerm("width:>height").matches(hdMetricSearchable)).toBe(true);
      expect(parseSearchTerm("width:>height").matches(squareMetricSearchable)).toBe(false);
    });

    test("compares one metric less than another", () => {
      expect(parseSearchTerm("height:<width").matches(sdMetricSearchable)).toBe(true);
      expect(parseSearchTerm("duration:<score").matches(hdMetricSearchable)).toBe(false);
    });

    test("inverts a metric comparison when negated", () => {
      expect(parseSearchTerm("-width:height").matches(squareMetricSearchable)).toBe(false);
      expect(parseSearchTerm("-width:height").matches(hdMetricSearchable)).toBe(true);
    });

    test("matches a zero value", () => {
      expect(parseSearchTerm("duration:0").matches(squareMetricSearchable)).toBe(true);
      expect(parseSearchTerm("duration:0").matches(hdMetricSearchable)).toBe(false);
    });

    test("compares a large id", () => {
      expect(parseSearchTerm("id:9999999").matches(squareMetricSearchable)).toBe(true);
      expect(parseSearchTerm("id:<9999999").matches(hdMetricSearchable)).toBe(true);
    });
  });

  describe("comparison", () => {
    test("flags a self-comparison as tautological and leaves other comparisons unflagged", () => {
      expect(parseMetricSearchTerm("width:width")?.comparison.isTautological).toBe(true);
      expect(parseMetricSearchTerm("width:>width")?.comparison.isTautological).toBe(true);
      expect(parseMetricSearchTerm("width:height")?.comparison.isTautological).toBe(false);
      expect(parseMetricSearchTerm("width:100")?.comparison.isTautological).toBe(false);
    });
  });
});
