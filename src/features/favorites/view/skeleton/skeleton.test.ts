import { beforeEach, describe, expect, test, vi } from "vitest";
import { MemoryKeyValueStore } from "@/adapters/memory/ports/key_value_store/key_value_store";
import { FavoritesSkeleton } from "@/features/favorites/view/skeleton/skeleton";
import { SkeletonConfig } from "@/config/skeleton_config";

function createThumb(width: number, height: number): HTMLElement {
  const thumb = document.createElement("div");
  const image = document.createElement("img");

  Object.defineProperty(image, "naturalWidth", { value: width });
  Object.defineProperty(image, "naturalHeight", { value: height });
  thumb.append(image);
  return thumb;
}

function tiledFor(skeleton: FavoritesSkeleton): HTMLElement[] | undefined {
  const tile = vi.fn<(elements: HTMLElement[]) => void>();

  skeleton.show(tile);
  return tile.mock.calls[0]?.[0];
}

let store: MemoryKeyValueStore;

describe("FavoritesSkeleton", () => {
  beforeEach(() => {
    store = new MemoryKeyValueStore();
  });

  test("tiles the default number of placeholders", () => {
    expect(tiledFor(new FavoritesSkeleton(store, "grid"))).toHaveLength(SkeletonConfig.defaultItemCount);
  });

  test("tiles the requested number of placeholders in the layout", () => {
    const tiled = tiledFor(new FavoritesSkeleton(store, "row", 3));

    expect(tiled?.map(element => element.dataset.layout)).toEqual(["row", "row", "row"]);
  });

  test("once real thumbs load, stops showing and shapes the next visit's placeholders after them", () => {
    const skeleton = new FavoritesSkeleton(store, "native", 2);

    skeleton.collectAspectRatios([createThumb(120, 240), createThumb(200, 150)]);
    const next = tiledFor(new FavoritesSkeleton(store, "native", 2));

    expect(tiledFor(skeleton)).toBeUndefined();
    expect(next?.map(element => [element.style.width, element.style.height])).toEqual([["120px", "240px"], ["200px", "150px"]]);
  });

  test("collects aspect ratios only once", () => {
    const skeleton = new FavoritesSkeleton(store, "native", 1);

    skeleton.collectAspectRatios([createThumb(120, 240)]);
    skeleton.collectAspectRatios([createThumb(200, 150)]);
    expect(tiledFor(new FavoritesSkeleton(store, "native", 1))?.[0].style.width).toBe("120px");
  });
});
