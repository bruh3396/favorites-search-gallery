import { describe, expect, test } from "vitest";
import { chunk, hasIntersection, intersection, isIndexInBounds, itemsAround, shuffleInPlace, union, wrappedItemsAround } from "@/utils/pure/collection";
import { numbersAround, numbersInRange, randomInt } from "@/utils/pure/number";

describe("isIndexInBounds", () => {
  test("empty", () => {
    expect(isIndexInBounds([], 0)).toBe(false);
  });

  test("in bounds", () => {
    const array = [1, 2, 3];

    expect(isIndexInBounds(array, 0)).toBe(true);
    expect(isIndexInBounds(array, 1)).toBe(true);
    expect(isIndexInBounds(array, 2)).toBe(true);
  });

  test("out of bounds", () => {
    const array = [1, 2, 3];

    expect(isIndexInBounds(array, -2)).toBe(false);
    expect(isIndexInBounds(array, -1)).toBe(false);
    expect(isIndexInBounds(array, 3)).toBe(false);
    expect(isIndexInBounds(array, 4)).toBe(false);
    expect(isIndexInBounds(array, 5)).toBe(false);
    expect(isIndexInBounds(array, 6)).toBe(false);
    expect(isIndexInBounds(array, 7)).toBe(false);
  });
});

describe("shuffleArray", () => {
  const numbers = Array.from({ length: 1000 }, (_, i) => i + 1);
  const numberSet = new Set(numbers);

  test("empty", () => {
    expect(shuffleInPlace([])).toStrictEqual([]);
  });

  test("one", () => {
    expect(shuffleInPlace([1])).toStrictEqual([1]);
  });

  test("many", () => {
    const shuffled = shuffleInPlace(numbers.slice());

    expect(shuffled).toHaveLength(numbers.length);
    expect(shuffled).not.toStrictEqual(numbers);

    for (const num of numbers) {
      expect(numberSet.has(num)).toBe(true);
    }
  });
});

describe("getNumbersAround", () => {
  test("empty", () => {
    expect(numbersAround(0, 0, 0, 0)).toStrictEqual([]);
  });

  test("one", () => {
    expect(numbersAround(0, 1, 0, 0)).toStrictEqual([0]);
    expect(numbersAround(0, 1, -1, 1)).toStrictEqual([0]);
    expect(numbersAround(1, 1, -1, 1)).toStrictEqual([1]);
    expect(numbersAround(-1, 1, -1, 1)).toStrictEqual([-1]);
  });

  test("two", () => {
    expect(numbersAround(0, 2, -1, 1)).toStrictEqual([-1, 0]);
    expect(numbersAround(0, 2, -2, 2)).toStrictEqual([-1, 0]);
    expect(numbersAround(1, 2, -2, 2)).toStrictEqual([0, 1]);
    expect(numbersAround(-1, 2, -2, 2)).toStrictEqual([-2, -1]);
    expect(numbersAround(-2, 2, -2, 2)).toStrictEqual([-2, -1]);
  });

  test("three", () => {
    expect(numbersAround(0, 3, -1, 1)).toStrictEqual([-1, 0, 1]);
    expect(numbersAround(0, 3, -2, 2)).toStrictEqual([-1, 0, 1]);
  });

  test("many", () => {
    expect(numbersAround(40, 10, 30, 100)).toStrictEqual([40, 39, 41, 38, 42, 37, 43, 36, 44, 35].sort((a, b) => a - b));
  });

  test("count = 0", () => {
    expect(numbersAround(40, 0, 0, 100)).toStrictEqual([]);
    expect(numbersAround(40, 0, 30, 100)).toStrictEqual([]);
  });

  test("mix > max", () => {
    expect(numbersAround(40, 10, 100, 20)).toStrictEqual([]);
  });
});

describe("itemsAround", () => {
  function testItemsAroundIndex(array: number[], startIndex: number, limit: number, expected: number[]): void {
    const result = itemsAround(array, startIndex, limit);

    expect(result).toStrictEqual(expected);
  }

  test("empty", () => {
    for (let i = 0; i < 10; i += 1) {
      const startIndex = randomInt(100);
      const limit = randomInt(100);

      testItemsAroundIndex([], startIndex, limit, []);
    }
  });

  test("index out of bounds", () => {
    testItemsAroundIndex([1, 2, 3, 4, 5], -1, 3, []);
  });

  test("limit greater than length", () => {
    testItemsAroundIndex([1, 2], 0, 3, [1, 2]);
  });

  test("zero limit", () => {
    testItemsAroundIndex([1, 2], 0, 0, []);
  });

  test("normal cases", () => {
    testItemsAroundIndex([1, 2, 3, 4, 5], 2, 1, [3]);
    testItemsAroundIndex([1, 2, 3, 4, 5], 2, 3, [3, 2, 4]);
    testItemsAroundIndex([1, 2, 3, 4, 5], 0, 3, [1, 2, 3]);
    testItemsAroundIndex([1, 2, 3, 4, 5], 4, 3, [5, 4, 3]);
    testItemsAroundIndex([1, 2, 3, 4, 5], 2, 5, [3, 2, 4, 1, 5]);
    testItemsAroundIndex([1, 2, 3, 4, 5], 2, 4, [3, 2, 4, 1]);
  });
});

describe("wrappedItemsAround", () => {
  function testWrappedItemsAroundIndex(array: number[], startIndex: number, limit: number, expected: number[]): void {
    const result = wrappedItemsAround(array, startIndex, limit);

    expect(result).toStrictEqual(expected);
  }

  test("empty", () => {
    for (let i = 0; i < 10; i += 1) {
      const startIndex = randomInt(100);
      const limit = randomInt(100);

      testWrappedItemsAroundIndex([], startIndex, limit, []);
    }
  });

  test("index out of bounds", () => {
    testWrappedItemsAroundIndex([1, 2, 3, 4, 5], -1, 3, []);
  });

  test("limit greater than length", () => {
    testWrappedItemsAroundIndex([1, 2], 0, 3, [1, 2]);
  });

  test("zero limit", () => {
    testWrappedItemsAroundIndex([1, 2], 0, 0, []);
  });

  test("normal cases", () => {
    testWrappedItemsAroundIndex([1, 2, 3, 4, 5], 0, 5, [1, 5, 2, 4, 3]);
    testWrappedItemsAroundIndex([1, 2, 3, 4, 5], 2, 5, [3, 2, 4, 1, 5]);
    testWrappedItemsAroundIndex([1, 2, 3, 4, 5], 4, 5, [5, 4, 1, 3, 2]);
    testWrappedItemsAroundIndex([1, 2, 3, 4, 5], 0, 1, [1]);
    testWrappedItemsAroundIndex([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 9, 10, [10, 9, 1, 8, 2, 7, 3, 6, 4, 5]);
    testWrappedItemsAroundIndex([42], 0, 3, [42]);
    testWrappedItemsAroundIndex([1, 2, 3, 4, 5], -1, 3, []);
    testWrappedItemsAroundIndex([1, 2, 3, 4, 5], 2, 10, [3, 2, 4, 1, 5]);
    testWrappedItemsAroundIndex([], 2, 10, []);
    testWrappedItemsAroundIndex([], 0, 0, []);
    testWrappedItemsAroundIndex([1], 0, 0, []);
    testWrappedItemsAroundIndex([1], 0, 1, [1]);
    testWrappedItemsAroundIndex([50], 0, 2, [50]);
    testWrappedItemsAroundIndex([1, 2, 4, 5], 1, 3, [2, 1, 4]);
    testWrappedItemsAroundIndex([1, 2, 3, 4, 5, 6, 7, 8, 9], 4, 2, [5, 4]);
  });
});

describe("chunk", () => {
  test("empty", () => {
    for (let i = 0; i < 10; i += 1) {
      expect(chunk([], 3)).toStrictEqual([]);
    }
  });

  test("invalid chunk size", () => {
    const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    expect(chunk(digits, 0)).toStrictEqual([digits]);
    expect(chunk(digits, -1)).toStrictEqual([digits]);
    expect(chunk(digits, -2)).toStrictEqual([digits]);
    expect(chunk(digits, -2)).toStrictEqual([digits]);
  });

  test("normal cases", () => {
    const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    expect(chunk(digits, 1)).toStrictEqual([[1], [2], [3], [4], [5], [6], [7], [8], [9]]);
    expect(chunk(digits, 2)).toStrictEqual([[1, 2], [3, 4], [5, 6], [7, 8], [9]]);
    expect(chunk(digits, 3)).toStrictEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9]]);
    expect(chunk(digits, 4)).toStrictEqual([[1, 2, 3, 4], [5, 6, 7, 8], [9]]);
    expect(chunk(digits, 5)).toStrictEqual([[1, 2, 3, 4, 5], [6, 7, 8, 9]]);
    expect(chunk(digits, 6)).toStrictEqual([[1, 2, 3, 4, 5, 6], [7, 8, 9]]);
    expect(chunk(digits, 7)).toStrictEqual([[1, 2, 3, 4, 5, 6, 7], [8, 9]]);
    expect(chunk(digits, 8)).toStrictEqual([[1, 2, 3, 4, 5, 6, 7, 8], [9]]);
  });

  test("chunk size greater or equal to array size", () => {
    const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    expect(chunk(digits, 9)).toStrictEqual([digits]);
    expect(chunk(digits, 10)).toStrictEqual([digits]);
    expect(chunk(digits, 100)).toStrictEqual([digits]);
  });
});

describe("getNumberRange", () => {
  test("zero", () => {
    expect(numbersInRange(0, 0)).toStrictEqual([0]);
  });

  test("normal", () => {
    expect(numbersInRange(0, 1)).toStrictEqual([0, 1]);
    expect(numbersInRange(0, 0)).toStrictEqual([0]);
    expect(numbersInRange(0, 1)).toStrictEqual([0, 1]);
    expect(numbersInRange(1, 3)).toStrictEqual([1, 2, 3]);
    expect(numbersInRange(5, 7)).toStrictEqual([5, 6, 7]);
    expect(numbersInRange(-2, 2)).toStrictEqual([-2, -1, 0, 1, 2]);
    expect(numbersInRange(3, 3)).toStrictEqual([3]);
    expect(numbersInRange(10, 13)).toStrictEqual([10, 11, 12, 13]);
  });
});

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
