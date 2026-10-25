import { describe, expect, test, vi } from "vitest";
import { DEFAULT_SKELETON_DIMENSIONS } from "@/core/ui/post_grid/skeleton";
import { Favorite } from "@/core/features/favorites/favorite";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { Signal } from "@/core/utils/reactive/signal";
import { SkeletonDimensions } from "@/core/app/favorites/storage/skeleton_dimensions";

function createFavorite(width: number, height: number): Favorite {
  return {
    id: `${width}x${height}`,
    numericId: (width * 100) + height,
    media: { kind: "image", locator: "" },
    isNew: false,
    ratingBit: 0,
    tags: new Set(),
    getMetric: metric => (metric === "width" ? width : height)
  };
}

function setup(
  storage = new MemoryLocalKeyedValues(), ownerId = "1",
  { results = new Signal<readonly Favorite[]>([]), scheduler = new MemoryScheduler() } = {}
): SkeletonDimensions {
  return new SkeletonDimensions({ ownerId }, { storage, results, scheduler });
}

describe("SkeletonDimensions", () => {
  test("records results after they settle and cancels an empty result", () => {
    const storage = new MemoryLocalKeyedValues();
    const scheduler = new MemoryScheduler();
    const results = new Signal<readonly Favorite[]>([]);
    setup(storage, "1", { results, scheduler });

    results.value = [createFavorite(4, 3)];
    scheduler.advance(250);
    results.value = [];
    scheduler.advance(500);

    expect(storage.get("favoritesSkeleton")).toBeUndefined();

    results.value = [createFavorite(1, 2)];
    scheduler.advance(499);
    expect(storage.get("favoritesSkeleton")).toBeUndefined();
    scheduler.advance(1);
    expect(storage.get("favoritesSkeleton")).toEqual({ 1: [{ width: 1, height: 2 }] });
  });

  describe("value", () => {
    test("returns the default skeleton when the owner has none recorded", () => {
      expect(setup().value).toEqual(DEFAULT_SKELETON_DIMENSIONS);
    });

    test("returns the default skeleton when the record isn't a list of dimensions", () => {
      const storage = new MemoryLocalKeyedValues();

      storage.set("favoritesSkeleton", { 1: [{ width: "4", height: 3 }] });
      expect(setup(storage).value).toEqual(DEFAULT_SKELETON_DIMENSIONS);
    });
  });

  describe("record", () => {
    test("measures the favorites, skipping those whose dimensions aren't known", () => {
      const skeletonDimensions = setup();

      skeletonDimensions.record([createFavorite(4, 3), createFavorite(0, 0), createFavorite(1, 2)]);
      expect(skeletonDimensions.value).toEqual([{ width: 4, height: 3 }, { width: 1, height: 2 }]);
    });

    test("measures only the first 50 favorites", () => {
      const skeletonDimensions = setup();

      skeletonDimensions.record(Array.from({ length: 60 }, () => createFavorite(1, 1)));
      expect(skeletonDimensions.value).toHaveLength(50);
    });

    test("keeps the recorded skeleton when no favorite has known dimensions", () => {
      const storage = new MemoryLocalKeyedValues();

      setup(storage).record([createFavorite(4, 3)]);
      setup(storage).record([createFavorite(0, 0)]);
      expect(setup(storage).value).toEqual([{ width: 4, height: 3 }]);
    });

    test("doesn't write unchanged dimensions again", () => {
      const storage = new MemoryLocalKeyedValues();
      const skeletonDimensions = setup(storage);
      const write = vi.spyOn(storage, "set");

      skeletonDimensions.record([createFavorite(4, 3)]);
      skeletonDimensions.record([createFavorite(4, 3)]);
      expect(write).toHaveBeenCalledOnce();
    });

    test("keeps each owner's dimensions apart", () => {
      const storage = new MemoryLocalKeyedValues();

      setup(storage, "1").record([createFavorite(4, 3)]);
      setup(storage, "2").record([createFavorite(1, 2)]);
      expect(storage.get("favoritesSkeleton")).toEqual({ 1: [{ width: 4, height: 3 }], 2: [{ width: 1, height: 2 }] });
    });
  });
});
