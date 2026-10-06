import { PostGridSkeleton, PostGridSkeletonClass, createPostGridSkeleton } from "@/core/ui/post_grid/skeleton";
import { describe, expect, test } from "vitest";
import POST_GRID_CSS from "@/core/ui/post_grid/post_grid.css?inline";
import { PostGridClass } from "@/core/ui/post_grid/post_grid";
import { Signal } from "@/core/utils/reactive/signal";
import { TileClass } from "@/core/ui/post_grid/tile";
import { expectClassesStyled } from "@/testing/css";

function setup(isShown = new Signal(true)): PostGridSkeleton {
  return createPostGridSkeleton(document, {
    isShown,
    dimensions: [{ width: 4, height: 3 }, { width: 1, height: 2 }],
    layout: new Signal("grid"),
    size: new Signal(2)
  });
}

describe("createPostGridSkeleton", () => {
  test("draws a post grid of loading tiles shaped like the given dimensions", () => {
    const { element } = setup();
    const tiles = [...element.querySelectorAll<HTMLElement>(`.${TileClass.root}`)];

    expect(element.classList.contains(PostGridClass.root)).toBe(true);
    expect(tiles.map(tile => [tile.style.getPropertyValue("--fsg-Tile-aspect-ratio"), tile.dataset.loading])).toEqual([["4 / 3", ""], ["1 / 2", ""]]);
  });

  test("draws at most 50 tiles", () => {
    const { element } = createPostGridSkeleton(document, {
      isShown: new Signal(true),
      dimensions: Array.from({ length: 60 }, () => ({ width: 1, height: 1 })),
      layout: new Signal("grid"),
      size: new Signal(2)
    });

    expect(element.querySelectorAll(`.${TileClass.root}`)).toHaveLength(50);
  });

  test("shows and hides with its signal, hidden from assistive technology", () => {
    const isShown = new Signal(true);
    const { element } = setup(isShown);

    expect(element.getAttribute("aria-hidden")).toBe("true");
    isShown.value = false;
    expect(element.hidden).toBe(true);
  });

  test("stops following its signal once disposed", () => {
    const isShown = new Signal(true);
    const { element, dispose } = setup(isShown);

    dispose();
    isShown.value = false;
    expect(element.hidden).toBe(false);
  });

  test("styles every class it sets", () => {
    expectClassesStyled(PostGridSkeletonClass, POST_GRID_CSS);
  });
});
