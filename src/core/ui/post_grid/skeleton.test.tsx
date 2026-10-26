import { GridLayout, TilerClass } from "@/core/ui/post_grid/tiler";
import { SkeletonGrid, SkeletonGridClass, SkeletonGridProps } from "@/core/ui/post_grid/skeleton";
import { describe, expect, test } from "vitest";
import { h, render } from "@/core/ui/h/h";
import POST_GRID_CSS from "@/core/ui/post_grid/post_grid.css?inline";
import { PostGridClass } from "@/core/ui/post_grid/post_grid";
import { Scoped } from "@/core/utils/reactive/scope";
import { Signal } from "@/core/utils/reactive/signal";
import { TileClass } from "@/core/ui/post_grid/tile";
import { expectClassesStyled } from "@/testing/css";

function setup({ dimensions = [{ width: 4, height: 3 }, { width: 1, height: 2 }], layout = new Signal<GridLayout>("grid"),
  tilesPerRow = new Signal(2), count = 50 }: Partial<SkeletonGridProps> = {}): Scoped<HTMLElement> {
  return render(document, () => <SkeletonGrid dimensions={dimensions} layout={layout} tilesPerRow={tilesPerRow} count={count} />);
}

function createSquares(count: number): { width: number; height: number }[] {
  return Array.from({ length: count }, () => ({ width: 1, height: 1 }));
}

describe("SkeletonGrid", () => {
  test("draws a post grid of tiles shaped like the given dimensions", () => {
    const { result: element } = setup();
    const tiles = [...element.querySelectorAll<HTMLElement>(`.${TileClass.root}`)];

    expect(element.classList.contains(PostGridClass.root)).toBe(true);
    expect(tiles.map(tile => tile.style.getPropertyValue("--fsg-Tile-aspect-ratio"))).toEqual(["4 / 3", "1 / 2"]);
  });

  test("draws at most 50 tiles", () => {
    const { result: element } = setup({ dimensions: createSquares(60), count: 100 });

    expect(element.querySelectorAll(`.${TileClass.root}`)).toHaveLength(50);
  });

  test("draws count tiles", () => {
    const { result: element } = setup({ dimensions: createSquares(60), count: 20 });

    expect(element.querySelectorAll(`.${TileClass.root}`)).toHaveLength(20);
  });

  test("tiles again when the layout or tiles per row change", () => {
    const layout = new Signal<GridLayout>("grid");
    const tilesPerRow = new Signal(2);
    const { result: element } = setup({ dimensions: createSquares(6), layout, tilesPerRow });

    layout.value = "column";
    expect(element.querySelectorAll(`.${TilerClass.column}`)).toHaveLength(2);
    tilesPerRow.value = 3;
    expect(element.querySelectorAll(`.${TilerClass.column}`)).toHaveLength(3);
    expect(element.style.getPropertyValue("--fsg-PostGrid-columns")).toBe("3");
  });

  test("hides itself from assistive technology", () => {
    const { result: element } = setup();

    expect(element.getAttribute("aria-hidden")).toBe("true");
  });

  test("stops following its signals once disposed", () => {
    const tilesPerRow = new Signal(2);
    const { result: element, dispose } = setup({ tilesPerRow });

    dispose();
    tilesPerRow.value = 5;
    expect(element.style.getPropertyValue("--fsg-PostGrid-columns")).toBe("2");
  });

  test("styles every class it sets", () => {
    expectClassesStyled(SkeletonGridClass, POST_GRID_CSS);
  });
});
