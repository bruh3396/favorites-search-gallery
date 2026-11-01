import { describe, expect, test } from "vitest";
import { DocTable } from "@/core/domain/search/engines/bit/indexes/doc_table";

function setup(occupiedCount: number, minCapacity: number = occupiedCount): DocTable<string> {
  const docTable = new DocTable<string>();

  docTable.reset(occupiedCount, minCapacity);
  return docTable;
}

describe("DocTable", () => {
  test("starts empty", () => {
    const docTable = new DocTable<string>();

    expect(docTable.size).toBe(0);
    expect(docTable.width).toBe(0);
    expect(docTable.liveDocs()).toEqual([]);
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
      const docTable = setup(1);

      docTable.place("apple", 0);
      docTable.reset(0, 0);
      expect(docTable.size).toBe(0);
      expect(docTable.findPosition("apple")).toBeUndefined();
      expect(docTable.liveDocs()).toEqual([]);
    });
  });

  describe("place", () => {
    test("finds a placed doc by its position", () => {
      const docTable = setup(2);

      docTable.place("apple", 0);
      docTable.place("banana", 1);
      expect(docTable.size).toBe(2);
      expect(docTable.findPosition("banana")).toBe(1);
      expect(docTable.findPosition("cherry")).toBeUndefined();
    });
  });

  describe("allocate", () => {
    test("hands out the lowest free positions past the occupied ones, ascending", () => {
      const docTable = setup(3);

      expect(docTable.allocate(2)).toEqual([3, 4]);
      expect(docTable.allocate(1)).toEqual([5]);
    });
  });

  describe("canFit", () => {
    test("returns whether more docs fit below the width", () => {
      const docTable = setup(0);

      docTable.place("apple", 0);
      expect(docTable.canFit(62)).toBe(true);
      expect(docTable.canFit(63)).toBe(false);
    });
  });

  describe("liveDocs", () => {
    test("lists placed docs in position order, skipping holes", () => {
      const docTable = setup(0);

      docTable.place("cherry", 5);
      docTable.place("apple", 1);
      expect(docTable.liveDocs()).toEqual(["apple", "cherry"]);
    });
  });

  describe("allDocs", () => {
    test("returns docs by position, holes included", () => {
      const docTable = setup(0);

      docTable.place("apple", 1);
      expect(docTable.allDocs()).toHaveLength(64);
      expect(docTable.allDocs()[0]).toBeUndefined();
      expect(docTable.allDocs()[1]).toBe("apple");
    });
  });
});
