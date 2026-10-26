import { GridTilerClass, tileGrid } from "@/core/ui/post_grid/grid_tiler";
import { describe, expect, test } from "vitest";

function createTiles(count: number): HTMLElement[] {
  return Array.from({ length: count }, () => document.createElement("div"));
}

describe("tileGrid", () => {
  test("writes the layout and the column count", () => {
    const grid = document.createElement("div");

    tileGrid(grid, [], { layout: "row", columnCount: 5 });
    expect(grid.dataset.layout).toBe("row");
    expect(grid.style.getPropertyValue("--fsg-GridTiler-columnCount")).toBe("5");
  });

  test("appends the tiles in order for a flowing layout", () => {
    const grid = document.createElement("div");
    const tiles = createTiles(3);

    tileGrid(grid, tiles, { layout: "grid", columnCount: 2 });
    expect([...grid.children]).toEqual(tiles);
  });

  test("deals the tiles round-robin into columns for the column layout", () => {
    const grid = document.createElement("div");
    const tiles = createTiles(5);

    tileGrid(grid, tiles, { layout: "column", columnCount: 2 });
    const [first, second] = grid.children;

    expect(grid.children).toHaveLength(2);
    expect(first.classList.contains(GridTilerClass.column)).toBe(true);
    expect([...first.children]).toEqual([tiles[0], tiles[2], tiles[4]]);
    expect([...second.children]).toEqual([tiles[1], tiles[3]]);
  });

  test("moves the tiles out of their columns when leaving the column layout", () => {
    const grid = document.createElement("div");
    const tiles = createTiles(3);

    tileGrid(grid, tiles, { layout: "column", columnCount: 2 });
    tileGrid(grid, tiles, { layout: "square", columnCount: 2 });
    expect([...grid.children]).toEqual(tiles);
  });
});
