import { describe, expect, test } from "vitest";
import { PositionIndex } from "@/core/domain/search/engines/set/indexes/position_index";

function createDocs(...names: string[]): { name: string }[] {
  return names.map(name => ({ name }));
}

describe("PositionIndex", () => {
  describe("findPosition", () => {
    test("reflects build order", () => {
      const [a, b, c] = createDocs("a", "b", "c");
      const positionIndex = new PositionIndex<{ name: string }>();

      positionIndex.build([a, b, c]);
      expect(positionIndex.findPosition(a)).toBe(0);
      expect(positionIndex.findPosition(b)).toBe(1);
      expect(positionIndex.findPosition(c)).toBe(2);
    });

    test("returns -1 for an unknown doc", () => {
      const [a] = createDocs("a");
      const positionIndex = new PositionIndex<{ name: string }>();

      positionIndex.build([]);
      expect(positionIndex.findPosition(a)).toBe(-1);
    });
  });

  describe("add", () => {
    test("appends at the next position", () => {
      const [a, b] = createDocs("a", "b");
      const positionIndex = new PositionIndex<{ name: string }>();

      positionIndex.build([a]);
      positionIndex.add(b);
      expect(positionIndex.findPosition(b)).toBe(1);
    });

    test("ignores a doc already indexed", () => {
      const [a, b] = createDocs("a", "b");
      const positionIndex = new PositionIndex<{ name: string }>();

      positionIndex.build([a, b]);
      positionIndex.add(a);
      expect(positionIndex.findPosition(a)).toBe(0);
      expect(positionIndex.findPosition(b)).toBe(1);
    });
  });

  describe("sort", () => {
    test("orders docs by their indexed position", () => {
      const [a, b, c] = createDocs("a", "b", "c");
      const positionIndex = new PositionIndex<{ name: string }>();

      positionIndex.build([a, b, c]);
      expect(positionIndex.sort([c, a, b])).toEqual([a, b, c]);
    });
  });

  describe("build", () => {
    test("replaces any prior positions", () => {
      const [a, b] = createDocs("a", "b");
      const positionIndex = new PositionIndex<{ name: string }>();

      positionIndex.build([a, b]);
      positionIndex.build([b, a]);
      expect(positionIndex.findPosition(b)).toBe(0);
      expect(positionIndex.findPosition(a)).toBe(1);
    });
  });
});
