import { describe, expect, test } from "vitest";
import { PositionIndex } from "@/core/search/engines/set/indexes/position_index";

function createDocs(...names: string[]): { name: string }[] {
  return names.map(name => ({ name }));
}

describe("PositionIndex", () => {
  describe("findPosition", () => {
    test("reflects build order", () => {
      const [a, b, c] = createDocs("a", "b", "c");
      const index = new PositionIndex<{ name: string }>();

      index.build([a, b, c]);
      expect(index.findPosition(a)).toBe(0);
      expect(index.findPosition(b)).toBe(1);
      expect(index.findPosition(c)).toBe(2);
    });

    test("returns -1 for an unknown doc", () => {
      const [a] = createDocs("a");
      const index = new PositionIndex<{ name: string }>();

      index.build([]);
      expect(index.findPosition(a)).toBe(-1);
    });
  });

  describe("add", () => {
    test("appends at the next position", () => {
      const [a, b] = createDocs("a", "b");
      const index = new PositionIndex<{ name: string }>();

      index.build([a]);
      index.add(b);
      expect(index.findPosition(b)).toBe(1);
    });

    test("ignores a doc already indexed", () => {
      const [a, b] = createDocs("a", "b");
      const index = new PositionIndex<{ name: string }>();

      index.build([a, b]);
      index.add(a);
      expect(index.findPosition(a)).toBe(0);
      expect(index.findPosition(b)).toBe(1);
    });
  });

  describe("sort", () => {
    test("orders docs by their indexed position", () => {
      const [a, b, c] = createDocs("a", "b", "c");
      const index = new PositionIndex<{ name: string }>();

      index.build([a, b, c]);
      expect(index.sort([c, a, b])).toEqual([a, b, c]);
    });
  });

  describe("build", () => {
    test("replaces any prior positions", () => {
      const [a, b] = createDocs("a", "b");
      const index = new PositionIndex<{ name: string }>();

      index.build([a, b]);
      index.build([b, a]);
      expect(index.findPosition(b)).toBe(0);
      expect(index.findPosition(a)).toBe(1);
    });
  });
});
