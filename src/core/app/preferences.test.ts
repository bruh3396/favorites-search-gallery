import { AppPreferences, createAppPreferences, pickPostGridPreferences } from "@/core/app/preferences";
import { describe, expect, test } from "vitest";
import { ALL_RATINGS_MASK } from "@/core/domain/post/post";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";

const STORED_SEARCH = {
  query: "apple",
  isInverted: true,
  sortKey: "random",
  isSortAscending: true,
  allowedRatings: 4,
  isBlacklistEnabled: true,
  isShuffled: true,
  shuffleSeed: 7
} as const;

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

  test("restores the pagination and search settings it stores", () => {
    const storage = new MemoryLocalKeyedValues();
    const preferences = createAppPreferences(storage);

    preferences.favoritesPagination.set({ size: 100, infiniteScroll: true });
    preferences.favoritesSearch.set(STORED_SEARCH);
    expect(createAppPreferences(storage).favoritesPagination.value).toEqual({ size: 100, infiniteScroll: true });
    expect(createAppPreferences(storage).favoritesSearch.value).toEqual(STORED_SEARCH);
  });

  test("falls back to the default for each stored search setting that isn't valid", () => {
    const storage = new MemoryLocalKeyedValues();

    const { query, sortKey, allowedRatings, shuffleSeed } = readDefaults().favoritesSearch.value;

    storage.set("favoritesSearch", { query: 3, sortKey: "unknown", isSortAscending: true, allowedRatings: ALL_RATINGS_MASK + 1, shuffleSeed: -1.5 });
    expect(createAppPreferences(storage).favoritesSearch.value).toMatchObject({ query, sortKey, isSortAscending: true, allowedRatings, shuffleSeed });
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
