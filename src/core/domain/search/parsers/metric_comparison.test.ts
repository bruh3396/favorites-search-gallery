import { describe, expect, test } from "vitest";
import { metricComparisonRegex, parseMetricComparison } from "@/core/domain/search/parsers/metric_comparison";

describe("metricComparisonRegex", () => {
  test("matches a metric compared to a number or another metric", () => {
    expect(metricComparisonRegex.test("score:10")).toBe(true);
    expect(metricComparisonRegex.test("score:<10")).toBe(true);
    expect(metricComparisonRegex.test("-width:>height")).toBe(true);
  });

  test("rejects anything else", () => {
    expect(metricComparisonRegex.test("score")).toBe(false);
    expect(metricComparisonRegex.test("score:=10")).toBe(false);
    expect(metricComparisonRegex.test("color:10")).toBe(false);
    expect(metricComparisonRegex.test("score:ten")).toBe(false);
  });
});

describe("parseMetricComparison", () => {
  test("parses a comparison against a number", () => {
    expect(parseMetricComparison("score:>10")).toEqual({
      metric: "score",
      operator: ":>",
      isRelative: false,
      rightHandMetric: "id",
      value: 10,
      isTautological: false
    });
  });

  test("parses a comparison against another metric", () => {
    expect(parseMetricComparison("width:<height")).toEqual({
      metric: "width",
      operator: ":<",
      isRelative: true,
      rightHandMetric: "height",
      value: 0,
      isTautological: false
    });
  });

  test("flags a metric compared to itself as tautological", () => {
    expect(parseMetricComparison("score:score").isTautological).toBe(true);
  });

  test("ignores a leading negation", () => {
    expect(parseMetricComparison("-score:5")).toMatchObject({ metric: "score", operator: ":", value: 5 });
  });

  test("falls back to width:0 for a term that isn't a comparison", () => {
    expect(parseMetricComparison("apple")).toMatchObject({ metric: "width", operator: ":", value: 0, isRelative: false });
  });
});
