import {describe, expect, test} from "vitest";
import {getNumbersAround, indexInBounds, shuffleArray} from "../../utils/array/array";

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
  const NUMBERS = Array.from({length: 1000}, (_, i) => i + 1);
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
