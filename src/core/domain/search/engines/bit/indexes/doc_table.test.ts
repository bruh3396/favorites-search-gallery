import { describe, expect, test } from "vitest";
import { DocTable } from "@/core/domain/search/engines/bit/indexes/doc_table";

function setup(occupiedCount: number, minCapacity: number = occupiedCount): DocTable<string> {
  const table = new DocTable<string>();

  table.reset(occupiedCount, minCapacity);
  return table;
}

describe("DocTable", () => {
  test("starts empty", () => {
    const table = new DocTable<string>();

    expect(table.size).toBe(0);
    expect(table.width).toBe(0);
    expect(table.liveDocs()).toEqual([]);
  });

  describe("reset", () => {
    test("reserves at least 64 positions", () => {
      expect(setup(0).width).toBe(64);
    });

    test("doubles its width until it exceeds the occupied count", () => {
      expect(setup(63).width).toBe(64);
      expect(setup(64).width).toBe(128);
      expect(setup(200).width).toBe(256);
    });

    test("sizes for the minimum capacity when it exceeds the occupied count", () => {
      expect(setup(10, 100).width).toBe(128);
    });

    test("forgets every placed doc", () => {
      const table = setup(1);

      table.place("apple", 0);
      table.reset(0, 0);
      expect(table.size).toBe(0);
      expect(table.findPosition("apple")).toBeUndefined();
      expect(table.liveDocs()).toEqual([]);
    });
  });

  describe("place", () => {
    test("finds a placed doc by its position", () => {
      const table = setup(2);

      table.place("apple", 0);
      table.place("banana", 1);
      expect(table.size).toBe(2);
      expect(table.findPosition("banana")).toBe(1);
      expect(table.findPosition("cherry")).toBeUndefined();
    });
  });

  describe("allocate", () => {
    test("hands out the lowest free positions past the occupied ones, ascending", () => {
      const table = setup(3);

      expect(table.allocate(2)).toEqual([3, 4]);
      expect(table.allocate(1)).toEqual([5]);
    });
  });

  describe("canFit", () => {
    test("returns whether more docs fit below the width", () => {
      const table = setup(0);

      table.place("apple", 0);
      expect(table.canFit(62)).toBe(true);
      expect(table.canFit(63)).toBe(false);
    });
  });

  describe("liveDocs", () => {
    test("lists placed docs in position order, skipping holes", () => {
      const table = setup(0);

      table.place("cherry", 5);
      table.place("apple", 1);
      expect(table.liveDocs()).toEqual(["apple", "cherry"]);
    });
  });

  describe("allDocs", () => {
    test("returns docs by position, holes included", () => {
      const table = setup(0);

      table.place("apple", 1);
      expect(table.allDocs()).toHaveLength(64);
      expect(table.allDocs()[0]).toBeUndefined();
      expect(table.allDocs()[1]).toBe("apple");
    });
  });
});
