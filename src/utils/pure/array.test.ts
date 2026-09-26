import { chunk, findFirstIndexWhere, grow, insertSorted, intersectSorted, intersectSortedNumbers, isIndexInBounds, itemsAround, partition, removeValue, shuffleInPlace, wrappedItemsAround } from "@/utils/pure/array";
import { describe, expect, test } from "vitest";
import { randomInt } from "@/utils/pure/number";

describe("partition", () => {
  test("splits into matching and rest, preserving order", () => {
    const [even, odd] = partition([1, 2, 3, 4, 5, 6], (n) => n % 2 === 0);

    expect(even).toEqual([2, 4, 6]);
    expect(odd).toEqual([1, 3, 5]);
  });

  test("evaluates the predicate once per element", () => {
    const seen: number[] = [];

    partition([1, 2, 3], (n) => {
      seen.push(n);
      return true;
    });
    expect(seen).toEqual([1, 2, 3]);
  });

  test("returns two empty arrays for an empty input", () => {
    expect(partition([], () => true)).toEqual([[], []]);
  });

  test("puts everything in one side when the predicate is constant", () => {
    expect(partition([1, 2, 3], () => true)).toEqual([[1, 2, 3], []]);
    expect(partition([1, 2, 3], () => false)).toEqual([[], [1, 2, 3]]);
  });
});

describe("insertSorted", () => {
  test("inserts into the middle keeping ascending order", () => {
    const sorted = [1, 3, 5];

    insertSorted(sorted, 4);
    expect(sorted).toEqual([1, 3, 4, 5]);
  });

  test("inserts at the front and back", () => {
    const front = [2, 3];
    const back = [2, 3];

    insertSorted(front, 1);
    insertSorted(back, 9);
    expect(front).toEqual([1, 2, 3]);
    expect(back).toEqual([2, 3, 9]);
  });

  test("inserts into an empty array", () => {
    const sorted: number[] = [];

    insertSorted(sorted, 7);
    expect(sorted).toEqual([7]);
  });

  test("allows duplicates", () => {
    const sorted = [1, 2, 2, 3];

    insertSorted(sorted, 2);
    expect(sorted).toEqual([1, 2, 2, 2, 3]);
  });
});

describe("removeValue", () => {
  test("removes the value when present", () => {
    const sorted = [1, 2, 3];

    removeValue(sorted, 2);
    expect(sorted).toEqual([1, 3]);
  });

  test("removes only the first occurrence", () => {
    const sorted = [1, 2, 2, 3];

    removeValue(sorted, 2);
    expect(sorted).toEqual([1, 2, 3]);
  });

  test("leaves the array unchanged when the value is absent", () => {
    const sorted = [1, 2, 3];

    removeValue(sorted, 9);
    expect(sorted).toEqual([1, 2, 3]);
  });
});

describe("intersectSortedNumbers", () => {
  test("returns common elements of two ascending arrays", () => {
    expect(intersectSortedNumbers([1, 3, 5, 7], [3, 4, 5, 6])).toEqual([3, 5]);
  });

  test("returns empty when there is no overlap", () => {
    expect(intersectSortedNumbers([1, 2], [3, 4])).toEqual([]);
  });

  test("returns empty when either array is empty", () => {
    expect(intersectSortedNumbers([], [1, 2])).toEqual([]);
    expect(intersectSortedNumbers([1, 2], [])).toEqual([]);
  });

  test("handles full overlap", () => {
    expect(intersectSortedNumbers([1, 2, 3], [1, 2, 3])).toEqual([1, 2, 3]);
  });

  test("does not mutate its inputs", () => {
    const a = [1, 2, 3];
    const b = [2, 3, 4];

    intersectSortedNumbers(a, b);
    expect(a).toEqual([1, 2, 3]);
    expect(b).toEqual([2, 3, 4]);
  });
});

describe("intersectSorted", () => {
  const compareStrings = (x: string, y: string): number => x.localeCompare(y);

  test("returns common elements under the given order", () => {
    expect(intersectSorted(["a", "c", "e", "g"], ["c", "d", "e", "f"], compareStrings)).toEqual(["c", "e"]);
  });

  test("returns empty when there is no overlap", () => {
    expect(intersectSorted(["a", "b"], ["c", "d"], compareStrings)).toEqual([]);
  });

  test("returns empty when either array is empty", () => {
    expect(intersectSorted([], ["a"], compareStrings)).toEqual([]);
    expect(intersectSorted(["a"], [], compareStrings)).toEqual([]);
  });

  test("respects a descending comparator", () => {
    expect(intersectSorted([9, 7, 5, 3], [8, 7, 4, 3], (x, y) => y - x)).toEqual([7, 3]);
  });

  test("keeps the element from the first array on a match", () => {
    const a = [{ id: 1, from: "a" }, { id: 2, from: "a" }];
    const b = [{ id: 2, from: "b" }];

    expect(intersectSorted(a, b, (x, y) => x.id - y.id)).toEqual([{ id: 2, from: "a" }]);
  });
});

describe("grow", () => {
  test("copies existing values into a larger array", () => {
    const grown = grow(new Uint16Array([1, 2, 3]), 6);

    expect(Array.from(grown)).toEqual([1, 2, 3, 0, 0, 0]);
  });

  test("preserves the typed array kind", () => {
    expect(grow(new Uint8Array(2), 4)).toBeInstanceOf(Uint8Array);
    expect(grow(new Uint16Array(2), 4)).toBeInstanceOf(Uint16Array);
    expect(grow(new Uint32Array(2), 4)).toBeInstanceOf(Uint32Array);
    expect(grow(new Float64Array([1.5]), 4)).toBeInstanceOf(Float64Array);
  });

  test("returns a new array, leaving the original untouched", () => {
    const original = new Uint32Array([7, 8]);
    const grown = grow(original, 4);

    grown[0] = 99;
    expect(grown).not.toBe(original);
    expect(Array.from(original)).toEqual([7, 8]);
  });

  test("equal capacity makes an identical copy", () => {
    expect(Array.from(grow(new Float64Array([0.5, 1.5]), 2))).toEqual([0.5, 1.5]);
  });
});

describe("findFirstIndexWhere", () => {
  const sorted = [10, 20, 20, 30];
  const firstAtOrAbove = (value: number): number => findFirstIndexWhere(sorted.length, index => sorted[index] >= value);

  test("returns the first index whose value satisfies the predicate", () => {
    expect(firstAtOrAbove(20)).toBe(1);
  });

  test("skips past every element sharing the boundary value", () => {
    expect(findFirstIndexWhere(sorted.length, index => sorted[index] > 20)).toBe(3);
  });

  test("returns 0 when every element satisfies the predicate", () => {
    expect(firstAtOrAbove(0)).toBe(0);
  });

  test("returns the length when no element satisfies the predicate", () => {
    expect(firstAtOrAbove(99)).toBe(4);
  });

  test("returns 0 for an empty range", () => {
    expect(findFirstIndexWhere(0, () => true)).toBe(0);
  });

  test("finds an exact match", () => {
    expect(firstAtOrAbove(30)).toBe(3);
  });
});

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

describe("itemsAround", () => {
  function expectItemsAroundIndex(array: number[], startIndex: number, limit: number, expected: number[]): void {
    const result = itemsAround(array, startIndex, limit);

    expect(result).toStrictEqual(expected);
  }

  test("empty", () => {
    for (let i = 0; i < 10; i += 1) {
      const startIndex = randomInt(100);
      const limit = randomInt(100);

      expectItemsAroundIndex([], startIndex, limit, []);
    }
  });

  test("index out of bounds", () => {
    expectItemsAroundIndex([1, 2, 3, 4, 5], -1, 3, []);
  });

  test("limit greater than length", () => {
    expectItemsAroundIndex([1, 2], 0, 3, [1, 2]);
  });

  test("zero limit", () => {
    expectItemsAroundIndex([1, 2], 0, 0, []);
  });

  test("normal cases", () => {
    expectItemsAroundIndex([1, 2, 3, 4, 5], 2, 1, [3]);
    expectItemsAroundIndex([1, 2, 3, 4, 5], 2, 3, [3, 2, 4]);
    expectItemsAroundIndex([1, 2, 3, 4, 5], 0, 3, [1, 2, 3]);
    expectItemsAroundIndex([1, 2, 3, 4, 5], 4, 3, [5, 4, 3]);
    expectItemsAroundIndex([1, 2, 3, 4, 5], 2, 5, [3, 2, 4, 1, 5]);
    expectItemsAroundIndex([1, 2, 3, 4, 5], 2, 4, [3, 2, 4, 1]);
  });
});

describe("wrappedItemsAround", () => {
  function expectWrappedItemsAroundIndex(array: number[], startIndex: number, limit: number, expected: number[]): void {
    const result = wrappedItemsAround(array, startIndex, limit);

    expect(result).toStrictEqual(expected);
  }

  test("empty", () => {
    for (let i = 0; i < 10; i += 1) {
      const startIndex = randomInt(100);
      const limit = randomInt(100);

      expectWrappedItemsAroundIndex([], startIndex, limit, []);
    }
  });

  test("index out of bounds", () => {
    expectWrappedItemsAroundIndex([1, 2, 3, 4, 5], -1, 3, []);
  });

  test("limit greater than length", () => {
    expectWrappedItemsAroundIndex([1, 2], 0, 3, [1, 2]);
  });

  test("zero limit", () => {
    expectWrappedItemsAroundIndex([1, 2], 0, 0, []);
  });

  test("normal cases", () => {
    expectWrappedItemsAroundIndex([1, 2, 3, 4, 5], 0, 5, [1, 5, 2, 4, 3]);
    expectWrappedItemsAroundIndex([1, 2, 3, 4, 5], 2, 5, [3, 2, 4, 1, 5]);
    expectWrappedItemsAroundIndex([1, 2, 3, 4, 5], 4, 5, [5, 4, 1, 3, 2]);
    expectWrappedItemsAroundIndex([1, 2, 3, 4, 5], 0, 1, [1]);
    expectWrappedItemsAroundIndex([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 9, 10, [10, 9, 1, 8, 2, 7, 3, 6, 4, 5]);
    expectWrappedItemsAroundIndex([42], 0, 3, [42]);
    expectWrappedItemsAroundIndex([1, 2, 3, 4, 5], -1, 3, []);
    expectWrappedItemsAroundIndex([1, 2, 3, 4, 5], 2, 10, [3, 2, 4, 1, 5]);
    expectWrappedItemsAroundIndex([], 2, 10, []);
    expectWrappedItemsAroundIndex([], 0, 0, []);
    expectWrappedItemsAroundIndex([1], 0, 0, []);
    expectWrappedItemsAroundIndex([1], 0, 1, [1]);
    expectWrappedItemsAroundIndex([50], 0, 2, [50]);
    expectWrappedItemsAroundIndex([1, 2, 4, 5], 1, 3, [2, 1, 4]);
    expectWrappedItemsAroundIndex([1, 2, 3, 4, 5, 6, 7, 8, 9], 4, 2, [5, 4]);
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
