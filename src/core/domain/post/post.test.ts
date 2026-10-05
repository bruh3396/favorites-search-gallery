import { describe, expect, test } from "vitest";
import { isMetric } from "@/core/domain/post/post";

describe("isMetric", () => {
  test("accepts every metric", () => {
    for (const metric of ["id", "score", "width", "height", "duration", "changedAt"]) {
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
