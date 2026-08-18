import { describe, expect, test } from "vitest";
import { indexInBounds, intersection, intersects, isRecord, itemsAroundIndex, shuffle, splitIntoChunks, union, wrappedItemsAroundIndex } from "@/utils/pure/collection";
import { numberRange, numbersAroundInRange, randomInt } from "@/utils/pure/number";

describe("indexInBounds", () => {
  test("empty", () => {
    expect(indexInBounds([], 0)).toBe(false);
  });

  test("in bounds", () => {
    const array = [1, 2, 3];

    expect(indexInBounds(array, 0)).toBe(true);
    expect(indexInBounds(array, 1)).toBe(true);
    expect(indexInBounds(array, 2)).toBe(true);
  });

  test("out of bounds", () => {
    const array = [1, 2, 3];

    expect(indexInBounds(array, -2)).toBe(false);
    expect(indexInBounds(array, -1)).toBe(false);
    expect(indexInBounds(array, 3)).toBe(false);
    expect(indexInBounds(array, 4)).toBe(false);
    expect(indexInBounds(array, 5)).toBe(false);
    expect(indexInBounds(array, 6)).toBe(false);
    expect(indexInBounds(array, 7)).toBe(false);
  });
});

describe("shuffleArray", () => {
  const numbers = Array.from({ length: 1000 }, (_, i) => i + 1);
  const numberSet = new Set(numbers);

  test("empty", () => {
    expect(shuffle([])).toStrictEqual([]);
  });

  test("one", () => {
    expect(shuffle([1])).toStrictEqual([1]);
  });

  test("many", () => {
    const shuffled = shuffle(numbers.slice());

    expect(shuffled).toHaveLength(numbers.length);
    expect(shuffled).not.toStrictEqual(numbers);

    for (const num of numbers) {
      expect(numberSet.has(num)).toBe(true);
    }
  });
});

describe("getNumbersAround", () => {
  test("empty", () => {
    expect(numbersAroundInRange(0, 0, 0, 0)).toStrictEqual([]);
  });

  test("one", () => {
    expect(numbersAroundInRange(0, 1, 0, 0)).toStrictEqual([0]);
    expect(numbersAroundInRange(0, 1, -1, 1)).toStrictEqual([0]);
    expect(numbersAroundInRange(1, 1, -1, 1)).toStrictEqual([1]);
    expect(numbersAroundInRange(-1, 1, -1, 1)).toStrictEqual([-1]);
  });

  test("two", () => {
    expect(numbersAroundInRange(0, 2, -1, 1)).toStrictEqual([-1, 0]);
    expect(numbersAroundInRange(0, 2, -2, 2)).toStrictEqual([-1, 0]);
    expect(numbersAroundInRange(1, 2, -2, 2)).toStrictEqual([0, 1]);
    expect(numbersAroundInRange(-1, 2, -2, 2)).toStrictEqual([-2, -1]);
    expect(numbersAroundInRange(-2, 2, -2, 2)).toStrictEqual([-2, -1]);
  });

  test("three", () => {
    expect(numbersAroundInRange(0, 3, -1, 1)).toStrictEqual([-1, 0, 1]);
    expect(numbersAroundInRange(0, 3, -2, 2)).toStrictEqual([-1, 0, 1]);
  });

  test("many", () => {
    expect(numbersAroundInRange(40, 10, 30, 100)).toStrictEqual([40, 39, 41, 38, 42, 37, 43, 36, 44, 35].sort((a, b) => a - b));
  });

  test("count = 0", () => {
    expect(numbersAroundInRange(40, 0, 0, 100)).toStrictEqual([]);
    expect(numbersAroundInRange(40, 0, 30, 100)).toStrictEqual([]);
  });

  test("mix > max", () => {
    expect(numbersAroundInRange(40, 10, 100, 20)).toStrictEqual([]);
  });
});

describe("itemsAroundIndex", () => {
  function testItemsAroundIndex(array: number[], startIndex: number, limit: number, expected: number[]): void {
    const result = itemsAroundIndex(array, startIndex, limit);

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

describe("wrappedItemsAroundIndex", () => {
  function testWrappedItemsAroundIndex(array: number[], startIndex: number, limit: number, expected: number[]): void {
    const result = wrappedItemsAroundIndex(array, startIndex, limit);

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

describe("splitIntoChunks", () => {
  test("empty", () => {
    for (let i = 0; i < 10; i += 1) {
      expect(splitIntoChunks([], 3)).toStrictEqual([]);
    }
  });

  test("invalid chunk size", () => {
    const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    expect(splitIntoChunks(digits, 0)).toStrictEqual([digits]);
    expect(splitIntoChunks(digits, -1)).toStrictEqual([digits]);
    expect(splitIntoChunks(digits, -2)).toStrictEqual([digits]);
    expect(splitIntoChunks(digits, -2)).toStrictEqual([digits]);
  });

  test("normal cases", () => {
    const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    expect(splitIntoChunks(digits, 1)).toStrictEqual([[1], [2], [3], [4], [5], [6], [7], [8], [9]]);
    expect(splitIntoChunks(digits, 2)).toStrictEqual([[1, 2], [3, 4], [5, 6], [7, 8], [9]]);
    expect(splitIntoChunks(digits, 3)).toStrictEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9]]);
    expect(splitIntoChunks(digits, 4)).toStrictEqual([[1, 2, 3, 4], [5, 6, 7, 8], [9]]);
    expect(splitIntoChunks(digits, 5)).toStrictEqual([[1, 2, 3, 4, 5], [6, 7, 8, 9]]);
    expect(splitIntoChunks(digits, 6)).toStrictEqual([[1, 2, 3, 4, 5, 6], [7, 8, 9]]);
    expect(splitIntoChunks(digits, 7)).toStrictEqual([[1, 2, 3, 4, 5, 6, 7], [8, 9]]);
    expect(splitIntoChunks(digits, 8)).toStrictEqual([[1, 2, 3, 4, 5, 6, 7, 8], [9]]);
  });

  test("chunk size greater or equal to array size", () => {
    const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    expect(splitIntoChunks(digits, 9)).toStrictEqual([digits]);
    expect(splitIntoChunks(digits, 10)).toStrictEqual([digits]);
    expect(splitIntoChunks(digits, 100)).toStrictEqual([digits]);
  });
});

describe("getNumberRange", () => {
  test("zero", () => {
    expect(numberRange(0, 0)).toStrictEqual([0]);
  });

  test("normal", () => {
    expect(numberRange(0, 1)).toStrictEqual([0, 1]);
    expect(numberRange(0, 0)).toStrictEqual([0]);
    expect(numberRange(0, 1)).toStrictEqual([0, 1]);
    expect(numberRange(1, 3)).toStrictEqual([1, 2, 3]);
    expect(numberRange(5, 7)).toStrictEqual([5, 6, 7]);
    expect(numberRange(-2, 2)).toStrictEqual([-2, -1, 0, 1, 2]);
    expect(numberRange(3, 3)).toStrictEqual([3]);
    expect(numberRange(10, 13)).toStrictEqual([10, 11, 12, 13]);
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
    expect(intersects(new Set(), new Set())).toBe(false);
  });

  test("one empty set", () => {
    expect(intersects(new Set([1, 2, 3]), new Set())).toBe(false);
    expect(intersects(new Set(), new Set([1, 2, 3]))).toBe(false);
  });

  test("no overlap", () => {
    expect(intersects(new Set([1, 2, 3]), new Set([4, 5, 6]))).toBe(false);
  });

  test("partial overlap", () => {
    expect(intersects(new Set([1, 2, 3]), new Set([3, 4, 5]))).toBe(true);
  });

  test("full overlap", () => {
    expect(intersects(new Set([1, 2, 3]), new Set([1, 2, 3]))).toBe(true);
  });

  test("different sizes", () => {
    expect(intersects(new Set([1]), new Set([1, 2, 3, 4, 5]))).toBe(true);
    expect(intersects(new Set([9]), new Set([1, 2, 3, 4, 5]))).toBe(false);
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

describe("isRecord", () => {
  test("accepts an object", () => {
    expect(isRecord({ a: 1 })).toBe(true);
  });

  test("accepts an array", () => {
    expect(isRecord([1, 2])).toBe(true);
  });

  test("rejects null", () => {
    expect(isRecord(null)).toBe(false);
  });

  test("rejects undefined", () => {
    expect(isRecord(undefined)).toBe(false);
  });

  test("rejects a string", () => {
    expect(isRecord("a")).toBe(false);
  });

  test("rejects a number", () => {
    expect(isRecord(1)).toBe(false);
  });
});
