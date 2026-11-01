import { describe, expect, test } from "vitest";
import { getNeighborhoodValues } from "@/core/utils/number/neighborhood";

describe("getNeighborhoodValues", () => {
  const letters = ["a", "b", "c", "d", "e"];
  const neighborhood = { isInBounds: (position: number): boolean => position >= 0 && position < letters.length, at: (position: number): string => letters[position] };

  test("returns nothing for a center out of bounds", () => {
    expect(getNeighborhoodValues(-1, 3, neighborhood)).toStrictEqual([]);
  });

  test("returns nothing for a count of 0", () => {
    expect(getNeighborhoodValues(2, 0, neighborhood)).toStrictEqual([]);
  });

  test("alternates outward from the center, left first", () => {
    expect(getNeighborhoodValues(2, 5, neighborhood)).toStrictEqual(["c", "b", "d", "a", "e"]);
  });

  test("continues on one side once the other is exhausted", () => {
    expect(getNeighborhoodValues(0, 3, neighborhood)).toStrictEqual(["a", "b", "c"]);
  });

  test("stops when both sides are exhausted", () => {
    expect(getNeighborhoodValues(2, 10, neighborhood)).toHaveLength(letters.length);
  });
});
