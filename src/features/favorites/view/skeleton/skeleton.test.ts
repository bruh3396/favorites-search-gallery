import { beforeEach, describe, expect, test, vi } from "vitest";
import { FavoritesSkeleton } from "@/features/favorites/view/skeleton/skeleton";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";
import { MemoryRandom } from "@/adapters/memory/ports/random/random";
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

let store: MemoryLocalKeyedValues;

describe("FavoritesSkeleton", () => {
  beforeEach(() => {
    store = new MemoryLocalKeyedValues();
  });

  test("tiles the default number of placeholders", () => {
    expect(tiledFor(new FavoritesSkeleton(store, new MemoryRandom(), "grid"))).toHaveLength(SkeletonConfig.defaultItemCount);
  });

  test("tiles the requested number of placeholders in the layout", () => {
    const tiled = tiledFor(new FavoritesSkeleton(store, new MemoryRandom(), "row", 3));

    expect(tiled?.map(element => element.dataset.layout)).toEqual(["row", "row", "row"]);
  });

  test("once real thumbs load, stops showing and shapes the next visit's placeholders after them", () => {
    const skeleton = new FavoritesSkeleton(store, new MemoryRandom(), "native", 2);

    skeleton.collectAspectRatios([createThumb(120, 240), createThumb(200, 150)]);
    const next = tiledFor(new FavoritesSkeleton(store, new MemoryRandom(), "native", 2));

    expect(tiledFor(skeleton)).toBeUndefined();
    expect(next?.map(element => [element.style.width, element.style.height])).toEqual([["120px", "240px"], ["200px", "150px"]]);
  });

  test("collects aspect ratios only once", () => {
    const skeleton = new FavoritesSkeleton(store, new MemoryRandom(), "native", 1);

    skeleton.collectAspectRatios([createThumb(120, 240)]);
    skeleton.collectAspectRatios([createThumb(200, 150)]);
    expect(tiledFor(new FavoritesSkeleton(store, new MemoryRandom(), "native", 1))?.[0].style.width).toBe("120px");
  });
});
