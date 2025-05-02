import {describe, expect, expectTypeOf, test} from "vitest";
import {SortedArray} from "../../components/functional/sorted_array";
import {getRandomPositiveInteger} from "../../utils/primitive/number";

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

    for (let i = 0; i < 100; i += 1) {
      const num = getRandomPositiveInteger(1000);

      sortedArray.insert(num);
      unsortedArray.push(num);
    }

    testSortedArrayOrder(sortedArray);
    expect(sortedArray.length).toBe(100);
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

  test("isSorted", () => {
    const sortedArray = new SortedArray<number>();

    expect(sortedArray.isSorted).toBe(true);
    sortedArray.insert(5);
    expect(sortedArray.isSorted).toBe(true);
    sortedArray.push(3);
    expect(sortedArray.isSorted).toBe(false);
    sortedArray.toArray();
    expect(sortedArray.isSorted).toBe(true);
  });
});
