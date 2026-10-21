import { AppPreferences, createAppPreferences, pickPostGridPreferences } from "@/core/app/preferences";
import { describe, expect, test } from "vitest";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";

function readDefaults(): AppPreferences {
  return createAppPreferences(new MemoryLocalKeyedValues());
}

describe("createAppPreferences", () => {
  test("restores a stored layout and falls back to the default for one it doesn't recognize", () => {
    const storage = new MemoryLocalKeyedValues();

    storage.set("postGridLayout", "row");
    expect(createAppPreferences(storage).postGridLayout.value).toBe("row");
    storage.set("postGridLayout", "masonry");
    expect(createAppPreferences(storage).postGridLayout.value).toBe(readDefaults().postGridLayout.value);
  });

  test("restores the pagination settings it stores", () => {
    const storage = new MemoryLocalKeyedValues();

    createAppPreferences(storage).favoritesPagination.set({ size: 100, infiniteScroll: true });
    expect(createAppPreferences(storage).favoritesPagination.value).toEqual({ size: 100, infiniteScroll: true });
  });

  test("falls back to the default page size for one below 1", () => {
    const storage = new MemoryLocalKeyedValues();

    storage.set("favoritesPagination", { size: 0, infiniteScroll: true });
    expect(createAppPreferences(storage).favoritesPagination.value).toEqual({ size: readDefaults().favoritesPagination.value.size, infiniteScroll: true });
  });
});

describe("pickPostGridPreferences", () => {
  test("returns the post grid preferences under their short names", () => {
    const preferences = createAppPreferences(new MemoryLocalKeyedValues());

    expect(pickPostGridPreferences(preferences)).toEqual({
      layout: preferences.postGridLayout, size: preferences.postGridSize, upscale: preferences.postGridUpscale
    });
  });
});
