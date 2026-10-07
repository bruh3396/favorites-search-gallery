import { createSkeletonDimensions, measureSkeletonDimensions } from "@/core/app/favorites_page/skeleton_dimensions";
import { describe, expect, test } from "vitest";
import { DEFAULT_SKELETON_DIMENSIONS } from "@/core/ui/post_grid/skeleton";
import { Favorite } from "@/core/features/favorites/types/favorite";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";

function createFavorite(width: number, height: number): Favorite {
  return {
    id: `${width}x${height}`,
    media: { kind: "image", locator: "" },
    isNew: false,
    tags: new Set(),
    getMetric: metric => (metric === "width" ? width : height)
  };
}

describe("createSkeletonDimensions", () => {
  test("starts from the default skeleton when the owner has none recorded", () => {
    expect(createSkeletonDimensions(new MemoryLocalKeyedValues(), "1").value).toEqual(DEFAULT_SKELETON_DIMENSIONS);
  });

  test("keeps each owner's dimensions apart", () => {
    const store = new MemoryLocalKeyedValues();

    createSkeletonDimensions(store, "1").set([{ width: 4, height: 3 }]);
    createSkeletonDimensions(store, "2").set([{ width: 1, height: 2 }]);
    expect(store.get("favoritesSkeleton")).toEqual({ 1: [{ width: 4, height: 3 }], 2: [{ width: 1, height: 2 }] });
    expect(createSkeletonDimensions(store, "1").value).toEqual([{ width: 4, height: 3 }]);
  });

  test("falls back to the default skeleton when the record isn't a list of dimensions", () => {
    const store = new MemoryLocalKeyedValues();

    store.set("favoritesSkeleton", { 1: [{ width: "4", height: 3 }] });
    expect(createSkeletonDimensions(store, "1").value).toEqual(DEFAULT_SKELETON_DIMENSIONS);
  });
});

describe("measureSkeletonDimensions", () => {
  test("measures the favorites, skipping those whose dimensions aren't known", () => {
    expect(measureSkeletonDimensions([createFavorite(4, 3), createFavorite(0, 0), createFavorite(1, 2)])).toEqual([
      { width: 4, height: 3 },
      { width: 1, height: 2 }
    ]);
  });

  test("measures only the first 50 favorites", () => {
    expect(measureSkeletonDimensions(Array.from({ length: 60 }, () => createFavorite(1, 1)))).toHaveLength(50);
  });
});
