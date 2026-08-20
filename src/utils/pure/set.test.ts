import { describe, expect, test } from "vitest";
import { hasIntersection, intersection, union } from "@/utils/pure/set";

describe("intersection", () => {
  test("empty sets", () => {
    expect(intersection(new Set(), new Set())).toStrictEqual(new Set());
  });

  test("one empty set", () => {
    expect(intersection(new Set([1, 2, 3]), new Set())).toStrictEqual(new Set());
    expect(intersection(new Set(), new Set([1, 2, 3]))).toStrictEqual(new Set());
  });

  test("no overlap", () => {
    expect(intersection(new Set([1, 2, 3]), new Set([4, 5, 6]))).toStrictEqual(new Set());
  });

  test("partial overlap", () => {
    expect(intersection(new Set([1, 2, 3]), new Set([2, 3, 4]))).toStrictEqual(new Set([2, 3]));
  });

  test("full overlap", () => {
    expect(intersection(new Set([1, 2, 3]), new Set([1, 2, 3]))).toStrictEqual(new Set([1, 2, 3]));
  });

  test("different sizes", () => {
    expect(intersection(new Set([1]), new Set([1, 2, 3, 4, 5]))).toStrictEqual(new Set([1]));
    expect(intersection(new Set([1, 2, 3, 4, 5]), new Set([3]))).toStrictEqual(new Set([3]));
  });

  test("strings", () => {
    expect(intersection(new Set(["a", "b"]), new Set(["b", "c"]))).toStrictEqual(new Set(["b"]));
  });
});

describe("intersects", () => {
  test("empty sets", () => {
    expect(hasIntersection(new Set(), new Set())).toBe(false);
  });

  test("one empty set", () => {
    expect(hasIntersection(new Set([1, 2, 3]), new Set())).toBe(false);
    expect(hasIntersection(new Set(), new Set([1, 2, 3]))).toBe(false);
  });

  test("no overlap", () => {
    expect(hasIntersection(new Set([1, 2, 3]), new Set([4, 5, 6]))).toBe(false);
  });

  test("partial overlap", () => {
    expect(hasIntersection(new Set([1, 2, 3]), new Set([3, 4, 5]))).toBe(true);
  });

  test("full overlap", () => {
    expect(hasIntersection(new Set([1, 2, 3]), new Set([1, 2, 3]))).toBe(true);
  });

  test("different sizes", () => {
    expect(hasIntersection(new Set([1]), new Set([1, 2, 3, 4, 5]))).toBe(true);
    expect(hasIntersection(new Set([9]), new Set([1, 2, 3, 4, 5]))).toBe(false);
  });
});

describe("union", () => {
  test("empty sets", () => {
    expect(union(new Set(), new Set())).toStrictEqual(new Set());
  });

  test("one empty set", () => {
    expect(union(new Set([1, 2, 3]), new Set())).toStrictEqual(new Set([1, 2, 3]));
    expect(union(new Set(), new Set([1, 2, 3]))).toStrictEqual(new Set([1, 2, 3]));
  });

  test("no overlap", () => {
    expect(union(new Set([1, 2]), new Set([3, 4]))).toStrictEqual(new Set([1, 2, 3, 4]));
  });

  test("partial overlap", () => {
    expect(union(new Set([1, 2, 3]), new Set([2, 3, 4]))).toStrictEqual(new Set([1, 2, 3, 4]));
  });

  test("full overlap", () => {
    expect(union(new Set([1, 2, 3]), new Set([1, 2, 3]))).toStrictEqual(new Set([1, 2, 3]));
  });

  test("strings", () => {
    expect(union(new Set(["a"]), new Set(["b"]))).toStrictEqual(new Set(["a", "b"]));
  });
});
