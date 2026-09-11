import { describe, expect, test } from "vitest";
import { PositionIndex } from "@/lib/search/engines/set/indexes/position_index";

function docs(...names: string[]): { name: string }[] {
  return names.map(name => ({ name }));
}

describe("PositionIndex", () => {
  test("positionOf reflects build order", () => {
    const [a, b, c] = docs("a", "b", "c");
    const index = new PositionIndex<{ name: string }>();

    index.build([a, b, c]);
    expect(index.positionOf(a)).toBe(0);
    expect(index.positionOf(b)).toBe(1);
    expect(index.positionOf(c)).toBe(2);
  });

  test("positionOf returns -1 for an unknown doc", () => {
    const [a] = docs("a");
    const index = new PositionIndex<{ name: string }>();

    index.build([]);
    expect(index.positionOf(a)).toBe(-1);
  });

  test("add appends at the next position", () => {
    const [a, b] = docs("a", "b");
    const index = new PositionIndex<{ name: string }>();

    index.build([a]);
    index.add(b);
    expect(index.positionOf(b)).toBe(1);
  });

  test("add is a no-op for a doc already indexed", () => {
    const [a, b] = docs("a", "b");
    const index = new PositionIndex<{ name: string }>();

    index.build([a, b]);
    index.add(a);
    expect(index.positionOf(a)).toBe(0);
    expect(index.positionOf(b)).toBe(1);
  });

  test("sort orders docs by their indexed position", () => {
    const [a, b, c] = docs("a", "b", "c");
    const index = new PositionIndex<{ name: string }>();

    index.build([a, b, c]);
    expect(index.sort([c, a, b])).toEqual([a, b, c]);
  });

  test("build replaces any prior positions", () => {
    const [a, b] = docs("a", "b");
    const index = new PositionIndex<{ name: string }>();

    index.build([a, b]);
    index.build([b, a]);
    expect(index.positionOf(b)).toBe(0);
    expect(index.positionOf(a)).toBe(1);
  });
});
