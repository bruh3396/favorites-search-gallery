import { describe, expect, test } from "vitest";
import { toRatingString, toRatingValue } from "@/features/favorites/model/search/rating";
import { DiscreteRating } from "@/types/search";

describe("toRatingValue", () => {
  test.each([
    ["Explicit", DiscreteRating.Explicit],
    ["explicit", DiscreteRating.Explicit],
    ["E", DiscreteRating.Explicit],
    ["e", DiscreteRating.Explicit],
    ["Questionable", DiscreteRating.Questionable],
    ["questionable", DiscreteRating.Questionable],
    ["Q", DiscreteRating.Questionable],
    ["q", DiscreteRating.Questionable],
    ["Safe", DiscreteRating.Safe],
    ["safe", DiscreteRating.Safe],
    ["S", DiscreteRating.Safe],
    ["s", DiscreteRating.Safe]
  ])("decodes %s", (input, expected) => {
    expect(toRatingValue(input)).toBe(expected);
  });

  test("defaults to Explicit for unknown ratings", () => {
    expect(toRatingValue("xyz")).toBe(DiscreteRating.Explicit);
  });

  test("defaults to Explicit for an empty string", () => {
    expect(toRatingValue("")).toBe(DiscreteRating.Explicit);
  });
});

describe("toRatingString", () => {
  test.each([
    [DiscreteRating.Explicit, "e"],
    [DiscreteRating.Questionable, "q"],
    [DiscreteRating.Safe, "s"]
  ])("encodes %s as %s", (input, expected) => {
    expect(toRatingString(input)).toBe(expected);
  });

  test.each([3, 5, 6, 7] as const)("defaults %s to Explicit", input => {
    expect(toRatingString(input)).toBe("e");
  });
});
