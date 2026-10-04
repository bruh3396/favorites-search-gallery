import { describe, expect, test, vi } from "vitest";
import { FavoritesSkeleton } from "@/features/favorites/view/skeleton/skeleton";
import { Layout } from "@/types/app";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/random_source";
import { SkeletonConfig } from "@/config/skeleton_config";

function createThumb(width: number, height: number): HTMLElement {
  const thumb = document.createElement("div");
  const image = document.createElement("img");

  Object.defineProperty(image, "naturalWidth", { value: width });
  Object.defineProperty(image, "naturalHeight", { value: height });
  thumb.append(image);
  return thumb;
}

// Skeletons made by one setup share storage, so a second one is the next visit.
function setup(): { createSkeleton: (layout: Layout) => FavoritesSkeleton } {
  const store = new MemoryLocalKeyedValues();
  return { createSkeleton: (layout: Layout): FavoritesSkeleton => new FavoritesSkeleton({ layout }, { store, randomSource: new MemoryRandomSource() }) };
}

function captureTiledElements(skeleton: FavoritesSkeleton): HTMLElement[] | undefined {
  const tile = vi.fn<(elements: HTMLElement[]) => void>();

  skeleton.show(tile);
  return tile.mock.calls[0]?.[0];
}

describe("FavoritesSkeleton", () => {
  describe("show", () => {
    test("tiles the default number of placeholders", () => {
      const { createSkeleton } = setup();

      expect(captureTiledElements(createSkeleton("grid"))).toHaveLength(SkeletonConfig.defaultItemCount);
    });

    test("tiles every placeholder in the layout", () => {
      const { createSkeleton } = setup();
      const layouts = new Set(captureTiledElements(createSkeleton("row"))?.map(element => element.dataset.layout));

      expect(layouts).toEqual(new Set(["row"]));
    });
  });

  describe("collectAspectRatios", () => {
    test("stops showing and shapes the next visit's placeholders after the real thumbs", () => {
      const { createSkeleton } = setup();
      const skeleton = createSkeleton("native");

      skeleton.collectAspectRatios([createThumb(120, 240), createThumb(200, 150)]);
      const next = captureTiledElements(createSkeleton("native"))?.slice(0, 2);
      const sizes = next?.map(element => [element.style.width, element.style.height]);

      expect(captureTiledElements(skeleton)).toBeUndefined();
      expect(sizes).toEqual([["120px", "240px"], ["200px", "150px"]]);
    });

    test("collects aspect ratios only once", () => {
      const { createSkeleton } = setup();
      const skeleton = createSkeleton("native");

      skeleton.collectAspectRatios([createThumb(120, 240)]);
      skeleton.collectAspectRatios([createThumb(200, 150)]);
      expect(captureTiledElements(createSkeleton("native"))?.[0].style.width).toBe("120px");
    });
  });
});
