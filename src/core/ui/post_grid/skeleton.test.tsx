import { PostGridSkeleton, PostGridSkeletonClass, PostGridSkeletonProps } from "@/core/ui/post_grid/skeleton";
import { describe, expect, test } from "vitest";
import { h, render } from "@/core/ui/h/h";
import POST_GRID_CSS from "@/core/ui/post_grid/post_grid.css?inline";
import { PostGridClass } from "@/core/ui/post_grid/post_grid";
import { Scoped } from "@/core/utils/reactive/scope";
import { Signal } from "@/core/utils/reactive/signal";
import { TileClass } from "@/core/ui/post_grid/tile";
import { expectClassesStyled } from "@/testing/css";

function setup({ isShown = new Signal(true), dimensions = [{ width: 4, height: 3 }, { width: 1, height: 2 }] }: Partial<PostGridSkeletonProps> = {}):
Scoped<HTMLElement> {
  return render(document, () => <PostGridSkeleton isShown={isShown} dimensions={dimensions} layout={new Signal("grid")} size={new Signal(2)} />);
}

describe("PostGridSkeleton", () => {
  test("draws a post grid of loading tiles shaped like the given dimensions", () => {
    const { result: element } = setup();
    const tiles = [...element.querySelectorAll<HTMLElement>(`.${TileClass.root}`)];

    expect(element.classList.contains(PostGridClass.root)).toBe(true);
    expect(tiles.map(tile => [tile.style.getPropertyValue("--fsg-Tile-aspect-ratio"), tile.dataset.loading])).toEqual([["4 / 3", ""], ["1 / 2", ""]]);
  });

  test("draws at most 50 tiles", () => {
    const { result: element } = setup({ dimensions: Array.from({ length: 60 }, () => ({ width: 1, height: 1 })) });

    expect(element.querySelectorAll(`.${TileClass.root}`)).toHaveLength(50);
  });

  test("shows and hides with its signal, hidden from assistive technology", () => {
    const isShown = new Signal(true);
    const { result: element } = setup({ isShown });

    expect(element.getAttribute("aria-hidden")).toBe("true");
    isShown.value = false;
    expect(element.hidden).toBe(true);
  });

  test("stops following its signal once disposed", () => {
    const isShown = new Signal(true);
    const { result: element, dispose } = setup({ isShown });

    dispose();
    isShown.value = false;
    expect(element.hidden).toBe(false);
  });

  test("styles every class it sets", () => {
    expectClassesStyled(PostGridSkeletonClass, POST_GRID_CSS);
  });
});
