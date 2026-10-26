import { ALL_RATINGS_MASK, isRatingMask, toRatingMask } from "@/core/domain/post/rating_mask";
import { describe, expect, test } from "vitest";
import { RATINGS } from "@/core/domain/post/rating";

describe("toRatingMask", () => {
  test("gives each rating its own bit, together making up every rating", () => {
    const masks = RATINGS.map(toRatingMask);

    expect(masks.every(mask => mask > 0 && (mask & (mask - 1)) === 0)).toBe(true);
    expect(new Set(masks).size).toBe(RATINGS.length);
    expect(masks.reduce((all, mask) => all | mask, 0)).toBe(ALL_RATINGS_MASK);
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
