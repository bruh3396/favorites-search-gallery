import {describe, expect, test} from "vitest";
import {indexInBounds, shuffleArray} from "../../utils/array/array";

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
