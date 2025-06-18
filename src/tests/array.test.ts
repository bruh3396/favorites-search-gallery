import { describe, expect, test } from "vitest";
import { getElementsAroundIndex, getNumbersAround, getWrappedElementsAroundIndex, indexInBounds, shuffleArray, splitIntoChunks } from "../utils/collection/array";
import { getRandomPositiveInteger } from "../utils/primitive/number";

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
  const NUMBERS = Array.from({ length: 1000 }, (_, i) => i + 1);
  const NUMBER_SET = new Set(NUMBERS);

  test("empty", () => {
    expect(shuffleArray([])).toStrictEqual([]);
  });

  test("one", () => {
    expect(shuffleArray([1])).toStrictEqual([1]);
  });

  test("many", () => {
    const shuffled = shuffleArray(NUMBERS.slice());

    expect(shuffled).toHaveLength(NUMBERS.length);
    expect(shuffled).not.toStrictEqual(NUMBERS);

    for (const num of NUMBERS) {
      expect(NUMBER_SET.has(num)).toBe(true);
    }
  });
});

describe("getNumbersAround", () => {
  test("empty", () => {
    expect(getNumbersAround(0, 0, 0, 0)).toStrictEqual([]);
  });

  test("one", () => {
    expect(getNumbersAround(0, 1, 0, 0)).toStrictEqual([0]);
    expect(getNumbersAround(0, 1, -1, 1)).toStrictEqual([0]);
    expect(getNumbersAround(1, 1, -1, 1)).toStrictEqual([1]);
    expect(getNumbersAround(-1, 1, -1, 1)).toStrictEqual([-1]);
  });

  test("two", () => {
    expect(getNumbersAround(0, 2, -1, 1)).toStrictEqual([-1, 0]);
    expect(getNumbersAround(0, 2, -2, 2)).toStrictEqual([-1, 0]);
    expect(getNumbersAround(1, 2, -2, 2)).toStrictEqual([0, 1]);
    expect(getNumbersAround(-1, 2, -2, 2)).toStrictEqual([-2, -1]);
    expect(getNumbersAround(-2, 2, -2, 2)).toStrictEqual([-2, -1]);
  });

  test("three", () => {
    expect(getNumbersAround(0, 3, -1, 1)).toStrictEqual([-1, 0, 1]);
    expect(getNumbersAround(0, 3, -2, 2)).toStrictEqual([-1, 0, 1]);
  });

  test("many", () => {
    expect(getNumbersAround(40, 10, 30, 100)).toStrictEqual([40, 39, 41, 38, 42, 37, 43, 36, 44, 35].sort((a, b) => a - b));
  });

  test("count = 0", () => {
    expect(getNumbersAround(40, 0, 0, 100)).toStrictEqual([]);
    expect(getNumbersAround(40, 0, 30, 100)).toStrictEqual([]);
  });

  test("mix > max", () => {
    expect(getNumbersAround(40, 10, 100, 20)).toStrictEqual([]);
  });
});

describe("getElementsAroundIndex", () => {
  function testElementsAroundIndex(array: number[], startIndex: number, limit: number, expected: number[]): void {
    const result = getElementsAroundIndex(array, startIndex, limit);

    expect(result).toStrictEqual(expected);
  }

  test("empty", () => {
    for (let i = 0; i < 10; i += 1) {
      const startIndex = getRandomPositiveInteger(100);
      const limit = getRandomPositiveInteger(100);

      testElementsAroundIndex([], startIndex, limit, []);
    }
  });

  test("index out of bounds", () => {
    testElementsAroundIndex([1, 2, 3, 4, 5], -1, 3, []);
  });

  test("limit greater than length", () => {
    testElementsAroundIndex([1, 2], 0, 3, [1, 2]);
  });

  test("zero limit", () => {
    testElementsAroundIndex([1, 2], 0, 0, []);
  });

  test("normal cases", () => {
    testElementsAroundIndex([1, 2, 3, 4, 5], 2, 1, [3]);
    testElementsAroundIndex([1, 2, 3, 4, 5], 2, 3, [3, 2, 4]);
    testElementsAroundIndex([1, 2, 3, 4, 5], 0, 3, [1, 2, 3]);
    testElementsAroundIndex([1, 2, 3, 4, 5], 4, 3, [5, 4, 3]);
    testElementsAroundIndex([1, 2, 3, 4, 5], 2, 5, [3, 2, 4, 1, 5]);
    testElementsAroundIndex([1, 2, 3, 4, 5], 2, 4, [3, 2, 4, 1]);
  });
});

describe("getWrappedElementsAroundIndex", () => {
  function testWrappedElementsAroundIndex(array: number[], startIndex: number, limit: number, expected: number[]): void {
    const result = getWrappedElementsAroundIndex(array, startIndex, limit);

    expect(result).toStrictEqual(expected);
  }

  test("empty", () => {
    for (let i = 0; i < 10; i += 1) {
      const startIndex = getRandomPositiveInteger(100);
      const limit = getRandomPositiveInteger(100);

      testWrappedElementsAroundIndex([], startIndex, limit, []);
    }
  });

  test("index out of bounds", () => {
    testWrappedElementsAroundIndex([1, 2, 3, 4, 5], -1, 3, []);
  });

  test("limit greater than length", () => {
    testWrappedElementsAroundIndex([1, 2], 0, 3, [1, 2]);
  });

  test("zero limit", () => {
    testWrappedElementsAroundIndex([1, 2], 0, 0, []);
  });

  test("normal cases", () => {
    testWrappedElementsAroundIndex([1, 2, 3, 4, 5], 0, 5, [1, 5, 2, 4, 3]);
    testWrappedElementsAroundIndex([1, 2, 3, 4, 5], 2, 5, [3, 2, 4, 1, 5]);
    testWrappedElementsAroundIndex([1, 2, 3, 4, 5], 4, 5, [5, 4, 1, 3, 2]);
    testWrappedElementsAroundIndex([1, 2, 3, 4, 5], 0, 1, [1]);
    testWrappedElementsAroundIndex([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 9, 10, [10, 9, 1, 8, 2, 7, 3, 6, 4, 5]);
    testWrappedElementsAroundIndex([42], 0, 3, [42]);
    testWrappedElementsAroundIndex([1, 2, 3, 4, 5], -1, 3, []);
    testWrappedElementsAroundIndex([1, 2, 3, 4, 5], 2, 10, [3, 2, 4, 1, 5]);
    testWrappedElementsAroundIndex([], 2, 10, []);
    testWrappedElementsAroundIndex([], 0, 0, []);
    testWrappedElementsAroundIndex([1], 0, 0, []);
    testWrappedElementsAroundIndex([1], 0, 1, [1]);
    testWrappedElementsAroundIndex([50], 0, 2, [50]);
    testWrappedElementsAroundIndex([1, 2, 4, 5], 1, 3, [2, 1, 4]);
    testWrappedElementsAroundIndex([1, 2, 3, 4, 5, 6, 7, 8, 9], 4, 2, [5, 4]);
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
