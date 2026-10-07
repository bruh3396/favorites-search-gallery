import { ALL_RATINGS_MASK, getRatingBit, isMetric, isRatingMask } from "@/core/domain/post/post";
import { describe, expect, test } from "vitest";

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

describe("getRatingBit", () => {
  test("gives each rating its own bit, together making up every rating", () => {
    const bits = [getRatingBit("explicit"), getRatingBit("questionable"), getRatingBit("safe")];

    expect(bits).toEqual([1, 2, 4]);
    expect(bits.reduce((mask, bit) => mask | bit, 0)).toBe(ALL_RATINGS_MASK);
  });
});

describe("isRatingMask", () => {
  test("accepts every combination of ratings, including none", () => {
    for (let mask = 0; mask <= ALL_RATINGS_MASK; mask += 1) {
      expect(isRatingMask(mask)).toBe(true);
    }
  });

  test.each([-1, ALL_RATINGS_MASK + 1, 1.5, "7", undefined])("rejects %s", value => {
    expect(isRatingMask(value)).toBe(false);
  });
});
