import { describe, expect, test } from "vitest";
import { hasIntersection, intersection, isInAllSets, union } from "@/utils/pure/set";

describe("intersection", () => {
  test("returns an empty set for two empty sets", () => {
    expect(intersection(new Set(), new Set())).toStrictEqual(new Set());
  });

  test("returns an empty set when one set is empty", () => {
    expect(intersection(new Set([1, 2, 3]), new Set())).toStrictEqual(new Set());
    expect(intersection(new Set(), new Set([1, 2, 3]))).toStrictEqual(new Set());
  });

  test("returns an empty set without overlap", () => {
    expect(intersection(new Set([1, 2, 3]), new Set([4, 5, 6]))).toStrictEqual(new Set());
  });

  test("returns the shared values on partial overlap", () => {
    expect(intersection(new Set([1, 2, 3]), new Set([2, 3, 4]))).toStrictEqual(new Set([2, 3]));
  });

  test("returns every value on full overlap", () => {
    expect(intersection(new Set([1, 2, 3]), new Set([1, 2, 3]))).toStrictEqual(new Set([1, 2, 3]));
  });

  test("intersects sets of different sizes", () => {
    expect(intersection(new Set([1]), new Set([1, 2, 3, 4, 5]))).toStrictEqual(new Set([1]));
    expect(intersection(new Set([1, 2, 3, 4, 5]), new Set([3]))).toStrictEqual(new Set([3]));
  });

  test("intersects string sets", () => {
    expect(intersection(new Set(["a", "b"]), new Set(["b", "c"]))).toStrictEqual(new Set(["b"]));
  });
});

describe("hasIntersection", () => {
  test("returns false for two empty sets", () => {
    expect(hasIntersection(new Set(), new Set())).toBe(false);
  });

  test("returns false when one set is empty", () => {
    expect(hasIntersection(new Set([1, 2, 3]), new Set())).toBe(false);
    expect(hasIntersection(new Set(), new Set([1, 2, 3]))).toBe(false);
  });

  test("returns false without overlap", () => {
    expect(hasIntersection(new Set([1, 2, 3]), new Set([4, 5, 6]))).toBe(false);
  });

  test("returns true on partial overlap", () => {
    expect(hasIntersection(new Set([1, 2, 3]), new Set([3, 4, 5]))).toBe(true);
  });

  test("returns true on full overlap", () => {
    expect(hasIntersection(new Set([1, 2, 3]), new Set([1, 2, 3]))).toBe(true);
  });

  test("compares sets of different sizes", () => {
    expect(hasIntersection(new Set([1]), new Set([1, 2, 3, 4, 5]))).toBe(true);
    expect(hasIntersection(new Set([9]), new Set([1, 2, 3, 4, 5]))).toBe(false);
  });
});

describe("isInAllSets", () => {
  test("returns true for no sets", () => {
    expect(isInAllSets(1, [])).toBe(true);
  });

  test("returns true when the value is in every set", () => {
    expect(isInAllSets(2, [new Set([1, 2]), new Set([2, 3]), new Set([2, 4])])).toBe(true);
  });

  test("returns false when the value is missing from one set", () => {
    expect(isInAllSets(2, [new Set([1, 2]), new Set([3, 4])])).toBe(false);
  });

  test("returns false when the value is missing from every set", () => {
    expect(isInAllSets(9, [new Set([1, 2]), new Set([3, 4])])).toBe(false);
  });

  test("returns false when any set is empty", () => {
    expect(isInAllSets(1, [new Set([1]), new Set()])).toBe(false);
  });

  test("checks string sets", () => {
    expect(isInAllSets("b", [new Set(["a", "b"]), new Set(["b", "c"])])).toBe(true);
  });
});

describe("union", () => {
  test("returns an empty set for two empty sets", () => {
    expect(union(new Set(), new Set())).toStrictEqual(new Set());
  });

  test("returns the other set when one set is empty", () => {
    expect(union(new Set([1, 2, 3]), new Set())).toStrictEqual(new Set([1, 2, 3]));
    expect(union(new Set(), new Set([1, 2, 3]))).toStrictEqual(new Set([1, 2, 3]));
  });

  test("combines sets without overlap", () => {
    expect(union(new Set([1, 2]), new Set([3, 4]))).toStrictEqual(new Set([1, 2, 3, 4]));
  });

  test("combines sets with partial overlap once each", () => {
    expect(union(new Set([1, 2, 3]), new Set([2, 3, 4]))).toStrictEqual(new Set([1, 2, 3, 4]));
  });

  test("returns the same values on full overlap", () => {
    expect(union(new Set([1, 2, 3]), new Set([1, 2, 3]))).toStrictEqual(new Set([1, 2, 3]));
  });

  test("combines string sets", () => {
    expect(union(new Set(["a"]), new Set(["b"]))).toStrictEqual(new Set(["a", "b"]));
  });
});
