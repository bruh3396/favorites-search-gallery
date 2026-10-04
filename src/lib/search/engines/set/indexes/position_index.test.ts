import { describe, expect, test } from "vitest";
import { PositionIndex } from "@/lib/search/engines/set/indexes/position_index";

function createDocs(...names: string[]): { name: string }[] {
  return names.map(name => ({ name }));
}

describe("PositionIndex", () => {
  describe("positionOf", () => {
    test("reflects build order", () => {
      const [a, b, c] = createDocs("a", "b", "c");
      const index = new PositionIndex<{ name: string }>();

      index.build([a, b, c]);
      expect(index.positionOf(a)).toBe(0);
      expect(index.positionOf(b)).toBe(1);
      expect(index.positionOf(c)).toBe(2);
    });

    test("returns -1 for an unknown doc", () => {
      const [a] = createDocs("a");
      const index = new PositionIndex<{ name: string }>();

      index.build([]);
      expect(index.positionOf(a)).toBe(-1);
    });
  });

  describe("add", () => {
    test("appends at the next position", () => {
      const [a, b] = createDocs("a", "b");
      const index = new PositionIndex<{ name: string }>();

      index.build([a]);
      index.add(b);
      expect(index.positionOf(b)).toBe(1);
    });

    test("ignores a doc already indexed", () => {
      const [a, b] = createDocs("a", "b");
      const index = new PositionIndex<{ name: string }>();

      index.build([a, b]);
      index.add(a);
      expect(index.positionOf(a)).toBe(0);
      expect(index.positionOf(b)).toBe(1);
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

  describe("complementOf", () => {
    test("returns the indexed docs not given, in position order", () => {
      const [a, b, c, stranger] = createDocs("a", "b", "c", "stranger");
      const index = new PositionIndex<{ name: string }>();

      index.build([a, b, c]);
      expect(index.complementOf([b, stranger])).toEqual([a, c]);
    });
  });

  describe("build", () => {
    test("replaces any prior positions", () => {
      const [a, b] = createDocs("a", "b");
      const index = new PositionIndex<{ name: string }>();

      index.build([a, b]);
      index.build([b, a]);
      expect(index.positionOf(b)).toBe(0);
      expect(index.positionOf(a)).toBe(1);
    });
  });
});
