import { describe, expect, test } from "vitest";
import { parseMetricComparison } from "@/core/domain/search/parsers/metric_comparison";

describe("parseMetricComparison", () => {
  test("parses a comparison against a number", () => {
    expect(parseMetricComparison("score:>10")).toEqual({
      metric: "score",
      comparator: ":>",
      isRelative: false,
      rightHandMetric: "id",
      value: 10,
      isTautological: false
    });
  });

  test("parses a comparison against another metric", () => {
    expect(parseMetricComparison("width:<height")).toEqual({
      metric: "width",
      comparator: ":<",
      isRelative: true,
      rightHandMetric: "height",
      value: 0,
      isTautological: false
    });
  });

  test.each(["score:score", "width:>width"])("flags %s, a metric compared to itself, as tautological", term => {
    expect(parseMetricComparison(term)?.isTautological).toBe(true);
  });

  test.each(["apple", "score", "score:=10", "color:10", "score:ten", "-score:5"])("returns null for %s", term => {
    expect(parseMetricComparison(term)).toBeNull();
  });
});
