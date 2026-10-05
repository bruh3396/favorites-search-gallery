import { TilerClass, applyTiling, arrangeTiles } from "@/core/ui/post_grid/tiler";
import { describe, expect, test } from "vitest";

function createTiles(count: number): HTMLElement[] {
  return Array.from({ length: count }, () => document.createElement("div"));
}

describe("applyTiling", () => {
  test("writes the layout and its sizes to the root", () => {
    const root = document.createElement("div");

    applyTiling(root, { layout: "row", columnCount: 4, rowHeightViewportPercent: 12.5 });
    expect(root.dataset.layout).toBe("row");
    expect(root.style.getPropertyValue("--fsg-PostGrid-columns")).toBe("4");
    expect(root.style.getPropertyValue("--fsg-PostGrid-row-height")).toBe("12.5vw");
  });
});

describe("arrangeTiles", () => {
  test("appends the tiles in order for a flowing layout", () => {
    const root = document.createElement("div");
    const tiles = createTiles(3);

    arrangeTiles(root, tiles, { layout: "grid", columnCount: 2 });
    expect([...root.children]).toEqual(tiles);
  });

  test("deals the tiles round-robin into columns for the column layout", () => {
    const root = document.createElement("div");
    const tiles = createTiles(5);

    arrangeTiles(root, tiles, { layout: "column", columnCount: 2 });
    const [first, second] = root.children;

    expect(root.children).toHaveLength(2);
    expect(first.className).toBe(TilerClass.column);
    expect([...first.children]).toEqual([tiles[0], tiles[2], tiles[4]]);
    expect([...second.children]).toEqual([tiles[1], tiles[3]]);
  });

  test("moves the tiles out of their columns when leaving the column layout", () => {
    const root = document.createElement("div");
    const tiles = createTiles(3);

    arrangeTiles(root, tiles, { layout: "column", columnCount: 2 });
    arrangeTiles(root, tiles, { layout: "square", columnCount: 2 });
    expect([...root.children]).toEqual(tiles);
  });
});
