import { METRICS, isMetric } from "@/core/domain/search/metric";
import { describe, expect, test } from "vitest";

describe("isMetric", () => {
  test("accepts every metric", () => {
    for (const metric of METRICS) {
      expect(isMetric(metric)).toBe(true);
    }
  });

  test("rejects sort keys that are not metrics", () => {
    expect(isMetric("favorited")).toBe(false);
    expect(isMetric("random")).toBe(false);
  });

  test("rejects other strings and non-strings", () => {
    expect(isMetric("100")).toBe(false);
    expect(isMetric("Score")).toBe(false);
    expect(isMetric(100)).toBe(false);
    expect(isMetric(undefined)).toBe(false);
  });
});
