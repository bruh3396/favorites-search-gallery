import { describe, expect, expectTypeOf, test } from "vitest";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/random_source";
import { SortedArray } from "@/lib/collection/sorted_array";
import { randomInt } from "@/utils/pure/number";

interface Item {
  id: number;
}

const randomSource = new MemoryRandomSource([0.7, 0.2, 0.9, 0.4, 0.1, 0.6, 0.3, 0.8, 0.5]);
const UNSORTED_FRUITS = ["grape", "apple", "banana", "kiwi", "orange", "pear", "peach", "apricot", "blueberry", "strawberry", "watermelon"];
const SORTED_FRUITS = ["apple", "apricot", "banana", "blueberry", "grape", "kiwi", "orange", "peach", "pear", "strawberry", "watermelon"];

function expectSortedOrder<T extends string | number>(sortedArray: SortedArray<T>): void {
  const array = sortedArray.toArray();

  for (let i = 0; i < array.length - 1; i += 1) {
    expect(array[i] <= array[i + 1]).toBe(true);
  }
}

function createNumbers(...numbers: number[]): SortedArray<number> {
  const sortedArray = new SortedArray<number>();

  for (const n of numbers) {
    sortedArray.add(n);
  }
  return sortedArray;
}

function createUnsortedNumbers(...numbers: number[]): SortedArray<number> {
  const sortedArray = new SortedArray<number>();

  for (const n of numbers) {
    sortedArray.push(n);
  }
  return sortedArray;
}

function createItems(...ids: number[]): SortedArray<Item> {
  const sortedArray = new SortedArray<Item>((a, b) => a.id - b.id);

  for (const id of ids) {
    sortedArray.add({ id });
  }
  return sortedArray;
}

describe("SortedArray", () => {
  test("converts to an array", () => {
    expectTypeOf(new SortedArray().toArray()).toBeArray();
  });

  test("sorts values passed to the constructor", () => {
    const sortedArray = new SortedArray<number>(undefined, [3, 1, 2]);

    expect(sortedArray.toArray()).toStrictEqual([1, 2, 3]);
  });

  describe("add", () => {
    test("keeps numbers sorted", () => {
      const sortedArray = new SortedArray<number>();
      const unsortedArray: number[] = [];

      for (let i = 0; i < 500; i += 1) {
        const num = randomInt(randomSource, 1_000);

        sortedArray.add(num);
        unsortedArray.push(num);
      }

      expectSortedOrder(sortedArray);
      expect(sortedArray.length).toBe(500);
      expect(sortedArray.toArray()).not.toStrictEqual(unsortedArray);
      expect(sortedArray.toArray()).toStrictEqual(unsortedArray.sort((a, b) => a - b));
    });

    test("keeps random strings sorted", () => {
      const sortedArray = new SortedArray<string>();
      const unsortedArray: string[] = [];

      for (let i = 0; i < 100; i += 1) {
        const str = Math.random().toString(36).substring(2, 7);

        sortedArray.add(str);
        unsortedArray.push(str);
      }

      expectSortedOrder(sortedArray);
      expect(sortedArray.length).toBe(100);
      expect(sortedArray.toArray()).not.toStrictEqual(unsortedArray);
      expect(sortedArray.toArray()).toStrictEqual(unsortedArray.sort());
    });

    test("keeps words sorted", () => {
      const sortedArray = new SortedArray<string>();

      for (const str of UNSORTED_FRUITS) {
        sortedArray.add(str);
      }
      expectSortedOrder(sortedArray);
      expect(sortedArray.toArray()).toStrictEqual(SORTED_FRUITS);
    });

    test("orders objects by a custom comparator", () => {
      expect(createItems(3, 1, 4, 2).toArray().map(item => item.id)).toStrictEqual([1, 2, 3, 4]);
    });
  });

  describe("push", () => {
    test("sorts pushed words once read", () => {
      const sortedArray = new SortedArray<string>();

      for (const str of UNSORTED_FRUITS) {
        sortedArray.push(str);
      }
      expectSortedOrder(sortedArray);
      expect(sortedArray.toArray()).toStrictEqual(SORTED_FRUITS);
    });

    test("sorts pushed numbers after an add once read", () => {
      const sortedArray = createNumbers(5);

      for (const n of [3, 1, 32, 23, 10, 7, 14]) {
        sortedArray.push(n);
      }
      expectSortedOrder(sortedArray);
    });
  });

  describe("addAll", () => {
    test("keeps every added value sorted", () => {
      const sortedArray = new SortedArray<number>();

      sortedArray.addAll([5, 3, 1, 32, 23, 10, 7, 14]);
      expectSortedOrder(sortedArray);
    });
  });

  describe("first", () => {
    test("returns undefined for an empty array", () => {
      expect(new SortedArray<number>().first()).toBeUndefined();
    });

    test("returns the smallest element without removing it", () => {
      const sortedArray = createNumbers(5, 2, 8, 1, 9, 3);

      expect(sortedArray.first()).toBe(1);
      expect(sortedArray.length).toBe(6);
    });

    test("sorts pushed values first", () => {
      const sortedArray = createUnsortedNumbers(5, 2, 8, 1);

      expect(sortedArray.first()).toBe(1);
      expectSortedOrder(sortedArray);
    });

    test("uses a custom comparator", () => {
      expect(createItems(3, 1, 2).first()?.id).toBe(1);
    });
  });

  describe("shift", () => {
    test("returns undefined for an empty array", () => {
      const sortedArray = new SortedArray<number>();

      expect(sortedArray.shift()).toBeUndefined();
      expect(sortedArray.length).toBe(0);
    });

    test("removes and returns the smallest element", () => {
      const sortedArray = createNumbers(5, 2, 8, 1, 9, 3);

      expect(sortedArray.shift()).toBe(1);
      expect(sortedArray.shift()).toBe(2);
      expect(sortedArray.shift()).toBe(3);
      expect(sortedArray.toArray()).toStrictEqual([5, 8, 9]);
      expect(sortedArray.length).toBe(3);
    });

    test("drains the array in order", () => {
      const sortedArray = createNumbers(5, 2, 8, 1, 9, 3);
      const drained: number[] = [];

      while (sortedArray.length > 0) {
        drained.push(sortedArray.shift()!);
      }
      expect(drained).toStrictEqual([1, 2, 3, 5, 8, 9]);
      expect(sortedArray.shift()).toBeUndefined();
    });

    test("sorts pushed values first", () => {
      const sortedArray = createUnsortedNumbers(5, 2, 8, 1);

      expect(sortedArray.shift()).toBe(1);
      expect(sortedArray.toArray()).toStrictEqual([2, 5, 8]);
      expectSortedOrder(sortedArray);
    });

    test("uses a custom comparator", () => {
      const sortedArray = createItems(3, 1, 2);

      expect(sortedArray.shift()?.id).toBe(1);
      expect(sortedArray.shift()?.id).toBe(2);
      expect(sortedArray.shift()?.id).toBe(3);
      expect(sortedArray.length).toBe(0);
    });
  });

  describe("remove", () => {
    test("removes a value and keeps the rest sorted", () => {
      const sortedArray = createNumbers(3, 1, 4, 1, 5, 9, 2, 6);

      expect(sortedArray.remove(4)).toBe(true);
      expect(sortedArray.toArray()).toStrictEqual([1, 1, 2, 3, 5, 6, 9]);
      expect(sortedArray.length).toBe(7);
      expectSortedOrder(sortedArray);
    });

    test("returns false when the value is missing", () => {
      const sortedArray = createNumbers(1, 2, 3);

      expect(sortedArray.remove(99)).toBe(false);
      expect(sortedArray.toArray()).toStrictEqual([1, 2, 3]);
    });

    test("returns false for an empty array", () => {
      const sortedArray = new SortedArray<number>();

      expect(sortedArray.remove(1)).toBe(false);
      expect(sortedArray.length).toBe(0);
    });

    test("removes one duplicate at a time", () => {
      const sortedArray = createNumbers(5, 5, 5);

      expect(sortedArray.remove(5)).toBe(true);
      expect(sortedArray.toArray()).toStrictEqual([5, 5]);
      expect(sortedArray.remove(5)).toBe(true);
      expect(sortedArray.remove(5)).toBe(true);
      expect(sortedArray.remove(5)).toBe(false);
      expect(sortedArray.length).toBe(0);
    });

    test("removes from pushed values", () => {
      const sortedArray = createUnsortedNumbers(3, 1, 4, 2);

      expect(sortedArray.remove(4)).toBe(true);
      expect(sortedArray.remove(99)).toBe(false);
      expect(sortedArray.length).toBe(3);
      expectSortedOrder(sortedArray);
    });

    test("removes the first and last elements", () => {
      const sortedArray = createNumbers(1, 2, 3, 4, 5);

      expect(sortedArray.remove(1)).toBe(true);
      expect(sortedArray.toArray()).toStrictEqual([2, 3, 4, 5]);
      expect(sortedArray.remove(5)).toBe(true);
      expect(sortedArray.toArray()).toStrictEqual([2, 3, 4]);
      expectSortedOrder(sortedArray);
    });

    test("removes an object it was given", () => {
      const items: Item[] = [{ id: 3 }, { id: 1 }, { id: 4 }, { id: 2 }];
      const sortedArray = new SortedArray<Item>((a, b) => a.id - b.id);

      for (const item of items) {
        sortedArray.add(item);
      }
      expect(sortedArray.remove(items[2])).toBe(true);
      expect(sortedArray.toArray().map(item => item.id)).toStrictEqual([1, 2, 3]);
    });

    test("finds an object by comparator equality, not identity", () => {
      const sortedArray = createItems(1, 2, 3);

      expect(sortedArray.remove({ id: 2 })).toBe(true);
      expect(sortedArray.toArray().map(item => item.id)).toStrictEqual([1, 3]);
    });
  });
});
