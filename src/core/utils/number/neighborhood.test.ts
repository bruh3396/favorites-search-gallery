import { describe, expect, test } from "vitest";
import { getValuesAround } from "@/core/utils/number/neighborhood";

describe("getValuesAround", () => {
  const letters = ["a", "b", "c", "d", "e"];
  const neighborhood = { isInBounds: (position: number): boolean => position >= 0 && position < letters.length, at: (position: number): string => letters[position] };

  test("returns nothing for a center out of bounds", () => {
    expect(getValuesAround(-1, 3, neighborhood)).toStrictEqual([]);
  });

  test("returns nothing for a count of 0", () => {
    expect(getValuesAround(2, 0, neighborhood)).toStrictEqual([]);
  });

  test("alternates outward from the center, left first", () => {
    expect(getValuesAround(2, 5, neighborhood)).toStrictEqual(["c", "b", "d", "a", "e"]);
  });

  test("continues on one side once the other is exhausted", () => {
    expect(getValuesAround(0, 3, neighborhood)).toStrictEqual(["a", "b", "c"]);
  });

  test("stops when both sides are exhausted", () => {
    expect(getValuesAround(2, 10, neighborhood)).toHaveLength(letters.length);
  });
});
