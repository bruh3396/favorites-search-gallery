import { TilerClass, applyTiling, arrangeTiles } from "@/core/ui/post_grid/tiler";
import { describe, expect, test, vi } from "vitest";

function createTiles(count: number): HTMLElement[] {
  return Array.from({ length: count }, () => document.createElement("div"));
}

describe("applyTiling", () => {
  test("writes the layout, the size, and the column count the size rounds to", () => {
    const root = document.createElement("div");

    applyTiling(root, { layout: "row", size: 4.6 });
    expect(root.dataset.layout).toBe("row");
    expect(root.style.getPropertyValue("--fsg-PostGrid-size")).toBe("4.6");
    expect(root.style.getPropertyValue("--fsg-PostGrid-columns")).toBe("5");
  });
});

describe("arrangeTiles", () => {
  test("appends the tiles in order for a flowing layout, without asking for the column count", () => {
    const root = document.createElement("div");
    const tiles = createTiles(3);
    const getColumnCount = vi.fn(() => 2);

    arrangeTiles(root, tiles, { layout: "grid", getColumnCount });
    expect([...root.children]).toEqual(tiles);
    expect(getColumnCount).not.toHaveBeenCalled();
  });

  test("deals the tiles round-robin into columns for the column layout", () => {
    const root = document.createElement("div");
    const tiles = createTiles(5);

    arrangeTiles(root, tiles, { layout: "column", getColumnCount: () => 2 });
    const [first, second] = root.children;

    expect(root.children).toHaveLength(2);
    expect(first.className).toBe(TilerClass.column);
    expect([...first.children]).toEqual([tiles[0], tiles[2], tiles[4]]);
    expect([...second.children]).toEqual([tiles[1], tiles[3]]);
  });

  test("moves the tiles out of their columns when leaving the column layout", () => {
    const root = document.createElement("div");
    const tiles = createTiles(3);

    arrangeTiles(root, tiles, { layout: "column", getColumnCount: () => 2 });
    arrangeTiles(root, tiles, { layout: "square", getColumnCount: () => 2 });
    expect([...root.children]).toEqual(tiles);
  });
});
