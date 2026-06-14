import { describe, expect, test } from "vitest";
import { DiscreteRating } from "@/types/search";
import { decodeRating } from "@/lib/search/rating";

describe("decodeRating", () => {
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
    expect(decodeRating(input)).toBe(expected);
  });

  test("defaults to Explicit for unknown ratings", () => {
    expect(decodeRating("xyz")).toBe(DiscreteRating.Explicit);
  });

  test("defaults to Explicit for an empty string", () => {
    expect(decodeRating("")).toBe(DiscreteRating.Explicit);
  });
});
