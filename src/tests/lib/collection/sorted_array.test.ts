import { describe, expect, expectTypeOf, test } from "vitest";
import { SortedArray } from "../../../lib/collection/sorted_array";
import { randomInt } from "../../../utils/number";

function testSortedArrayOrder<T extends string | number>(sortedArray: SortedArray<T>): void {
  const array = sortedArray.toArray();

  for (let i = 0; i < array.length - 1; i += 1) {
    expect(array[i] <= array[i + 1]).toBe(true);
  }
}

describe("SortedArray", () => {

  test("type", () => {
    expectTypeOf(new SortedArray().toArray()).toBeArray();
  });
  test("insert number", () => {
    const sortedArray = new SortedArray<number>();
    const unsortedArray: number[] = [];

    for (let i = 0; i < 500; i += 1) {
      const num = randomInt(1000);

      sortedArray.insert(num);
      unsortedArray.push(num);
    }

    testSortedArrayOrder(sortedArray);
    expect(sortedArray.length).toBe(500);
    expect(sortedArray.toArray()).not.toStrictEqual(unsortedArray);
    expect(sortedArray.toArray()).toStrictEqual(unsortedArray.sort((a, b) => a - b));
  });

  test("insert string", () => {
    const sortedArray = new SortedArray<string>();
    const unsortedArray: string[] = [];

    for (let i = 0; i < 100; i += 1) {
      const str = Math.random().toString(36).substring(2, 7);

      sortedArray.insert(str);
      unsortedArray.push(str);
    }

    testSortedArrayOrder(sortedArray);
    expect(sortedArray.length).toBe(100);
    expect(sortedArray.toArray()).not.toStrictEqual(unsortedArray);
    expect(sortedArray.toArray()).toStrictEqual(unsortedArray.sort());
  });

  test("custom strings", () => {
    const strings = ["grape", "apple", "banana", "kiwi", "orange", "pear", "peach", "apricot", "blueberry", "strawberry", "watermelon"];
    const sortedArray = new SortedArray<string>();
    const unsortedArray: string[] = [];

    for (const str of strings) {
      sortedArray.insert(str);
      unsortedArray.push(str);
    }
    testSortedArrayOrder(sortedArray);
    expect(sortedArray.length).toBe(strings.length);
    expect(sortedArray.toArray()).not.toStrictEqual(unsortedArray);
    expect(sortedArray.toArray()).toStrictEqual(unsortedArray.sort());
    expect(sortedArray.toArray()).toStrictEqual(["apple", "apricot", "banana", "blueberry", "grape", "kiwi", "orange", "peach", "pear", "strawberry", "watermelon"]);
  });

  test("custom strings", () => {
    const strings = ["grape", "apple", "banana", "kiwi", "orange", "pear", "peach", "apricot", "blueberry", "strawberry", "watermelon"];
    const sortedArray = new SortedArray<string>();
    const unsortedArray: string[] = [];

    for (const str of strings) {
      sortedArray.push(str);
      unsortedArray.push(str);
    }
    testSortedArrayOrder(sortedArray);
    expect(sortedArray.length).toBe(strings.length);
    expect(sortedArray.toArray()).not.toStrictEqual(unsortedArray);
    expect(sortedArray.toArray()).toStrictEqual(unsortedArray.sort());
    expect(sortedArray.toArray()).toStrictEqual(["apple", "apricot", "banana", "blueberry", "grape", "kiwi", "orange", "peach", "pear", "strawberry", "watermelon"]);
  });

  test("push unsorted", () => {
    const sortedArray = new SortedArray<number>();

    sortedArray.insert(5);
    sortedArray.push(3);
    sortedArray.push(1);
    sortedArray.push(32);
    sortedArray.push(23);
    sortedArray.push(10);
    sortedArray.push(7);
    sortedArray.push(14);
    sortedArray.toArray();
    testSortedArrayOrder(sortedArray);
  });

  test("first on empty array", () => {
    const sortedArray = new SortedArray<number>();

    expect(sortedArray.first()).toBeUndefined();
  });

  test("first returns smallest element", () => {
    const sortedArray = new SortedArray<number>();

    for (const n of [5, 2, 8, 1, 9, 3]) {
      sortedArray.insert(n);
    }
    expect(sortedArray.first()).toBe(1);
    expect(sortedArray.length).toBe(6);
  });

  test("first sorts if needed", () => {
    const sortedArray = new SortedArray<number>();

    sortedArray.push(5);
    sortedArray.push(2);
    sortedArray.push(8);
    sortedArray.push(1);
    expect(sortedArray.first()).toBe(1);
    testSortedArrayOrder(sortedArray);
  });

  test("first with custom comparator", () => {
    interface Item { id: number }
    const sortedArray = new SortedArray<Item>((a, b) => a.id - b.id);

    sortedArray.insert({ id: 3 });
    sortedArray.insert({ id: 1 });
    sortedArray.insert({ id: 2 });
    expect(sortedArray.first()?.id).toBe(1);
  });

  test("shift on empty array", () => {
    const sortedArray = new SortedArray<number>();

    expect(sortedArray.shift()).toBeUndefined();
    expect(sortedArray.length).toBe(0);
  });

  test("shift removes and returns smallest element", () => {
    const sortedArray = new SortedArray<number>();

    for (const n of [5, 2, 8, 1, 9, 3]) {
      sortedArray.insert(n);
    }
    expect(sortedArray.shift()).toBe(1);
    expect(sortedArray.shift()).toBe(2);
    expect(sortedArray.shift()).toBe(3);
    expect(sortedArray.toArray()).toStrictEqual([5, 8, 9]);
    expect(sortedArray.length).toBe(3);
  });

  test("shift drains array in order", () => {
    const sortedArray = new SortedArray<number>();

    for (const n of [5, 2, 8, 1, 9, 3]) {
      sortedArray.insert(n);
    }
    const drained: number[] = [];

    while (sortedArray.length > 0) {
      drained.push(sortedArray.shift()!);
    }
    expect(drained).toStrictEqual([1, 2, 3, 5, 8, 9]);
    expect(sortedArray.shift()).toBeUndefined();
  });

  test("shift sorts if needed", () => {
    const sortedArray = new SortedArray<number>();

    sortedArray.push(5);
    sortedArray.push(2);
    sortedArray.push(8);
    sortedArray.push(1);
    expect(sortedArray.shift()).toBe(1);
    expect(sortedArray.toArray()).toStrictEqual([2, 5, 8]);
    testSortedArrayOrder(sortedArray);
  });

  test("shift with custom comparator", () => {
    interface Item { id: number }
    const sortedArray = new SortedArray<Item>((a, b) => a.id - b.id);

    sortedArray.insert({ id: 3 });
    sortedArray.insert({ id: 1 });
    sortedArray.insert({ id: 2 });
    expect(sortedArray.shift()?.id).toBe(1);
    expect(sortedArray.shift()?.id).toBe(2);
    expect(sortedArray.shift()?.id).toBe(3);
    expect(sortedArray.length).toBe(0);
  });

  test("remove from sorted array", () => {
    const sortedArray = new SortedArray<number>();

    for (const n of [3, 1, 4, 1, 5, 9, 2, 6]) {
      sortedArray.insert(n);
    }
    expect(sortedArray.remove(4)).toBe(true);
    expect(sortedArray.toArray()).toStrictEqual([1, 1, 2, 3, 5, 6, 9]);
    expect(sortedArray.length).toBe(7);
    testSortedArrayOrder(sortedArray);
  });

  test("remove returns false when value missing", () => {
    const sortedArray = new SortedArray<number>();

    sortedArray.insert(1);
    sortedArray.insert(2);
    sortedArray.insert(3);
    expect(sortedArray.remove(99)).toBe(false);
    expect(sortedArray.toArray()).toStrictEqual([1, 2, 3]);
  });

  test("remove from empty array", () => {
    const sortedArray = new SortedArray<number>();

    expect(sortedArray.remove(1)).toBe(false);
    expect(sortedArray.length).toBe(0);
  });

  test("remove one of duplicates", () => {
    const sortedArray = new SortedArray<number>();

    sortedArray.insert(5);
    sortedArray.insert(5);
    sortedArray.insert(5);
    expect(sortedArray.remove(5)).toBe(true);
    expect(sortedArray.toArray()).toStrictEqual([5, 5]);
    expect(sortedArray.remove(5)).toBe(true);
    expect(sortedArray.remove(5)).toBe(true);
    expect(sortedArray.remove(5)).toBe(false);
    expect(sortedArray.length).toBe(0);
  });

  test("remove from unsorted array", () => {
    const sortedArray = new SortedArray<number>();

    sortedArray.push(3);
    sortedArray.push(1);
    sortedArray.push(4);
    sortedArray.push(2);
    expect(sortedArray.remove(4)).toBe(true);
    expect(sortedArray.remove(99)).toBe(false);
    expect(sortedArray.length).toBe(3);
    sortedArray.toArray();
    testSortedArrayOrder(sortedArray);
  });

  test("remove first and last elements", () => {
    const sortedArray = new SortedArray<number>();

    for (const n of [1, 2, 3, 4, 5]) {
      sortedArray.insert(n);
    }
    expect(sortedArray.remove(1)).toBe(true);
    expect(sortedArray.toArray()).toStrictEqual([2, 3, 4, 5]);
    expect(sortedArray.remove(5)).toBe(true);
    expect(sortedArray.toArray()).toStrictEqual([2, 3, 4]);
    testSortedArrayOrder(sortedArray);
  });

  test("custom comparator on objects", () => {
    interface Item { id: number; name: string }
    const items: Item[] = [
      { id: 3, name: "c" },
      { id: 1, name: "a" },
      { id: 4, name: "d" },
      { id: 2, name: "b" }
    ];
    const sortedArray = new SortedArray<Item>((a, b) => a.id - b.id);

    for (const item of items) {
      sortedArray.insert(item);
    }
    expect(sortedArray.toArray().map(i => i.id)).toStrictEqual([1, 2, 3, 4]);

    const removed = items[2];

    expect(sortedArray.remove(removed)).toBe(true);
    expect(sortedArray.toArray().map(i => i.id)).toStrictEqual([1, 2, 3]);
  });

  test("custom comparator — remove uses equality, not identity", () => {
    interface Item { id: number }
    const sortedArray = new SortedArray<Item>((a, b) => a.id - b.id);

    sortedArray.insert({ id: 1 });
    sortedArray.insert({ id: 2 });
    sortedArray.insert({ id: 3 });
    expect(sortedArray.remove({ id: 2 })).toBe(true);
    expect(sortedArray.toArray().map(i => i.id)).toStrictEqual([1, 3]);
  });
});
