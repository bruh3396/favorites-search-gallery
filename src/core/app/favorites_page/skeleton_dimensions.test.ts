import { describe, expect, test } from "vitest";
import { DEFAULT_SKELETON_DIMENSIONS } from "@/core/ui/post_grid/skeleton";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";
import { createSkeletonDimensions } from "@/core/app/favorites_page/skeleton_dimensions";

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
