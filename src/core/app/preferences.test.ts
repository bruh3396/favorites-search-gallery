import { createAppPreferences, pickPostGridPreferences } from "@/core/app/preferences";
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

describe("createAppPreferences", () => {
  test("starts with the defaults when nothing is stored", () => {
    const { postGridLayout, postGridSize, postGridUpscale, favoritesPagination, favoritesSearch } = createAppPreferences(new MemoryLocalKeyedValues());

    expect([postGridLayout.value, postGridSize.value, postGridUpscale.value]).toEqual(["column", 6, true]);
    expect(favoritesPagination.value).toEqual({ size: 50, infiniteScroll: false });
    expect(favoritesSearch.value).toEqual({
      query: "",
      isInverted: false,
      sortKey: "favorited",
      isSortAscending: false,
      allowedRatings: ALL_RATINGS_MASK,
      isBlacklistEnabled: false,
      isShuffled: false,
      shuffleSeed: 0
    });
  });

  test("restores a stored layout and falls back to the default for one it doesn't recognize", () => {
    const storage = new MemoryLocalKeyedValues();

    storage.set("postGridLayout", "row");
    expect(createAppPreferences(storage).postGridLayout.value).toBe("row");
    storage.set("postGridLayout", "masonry");
    expect(createAppPreferences(storage).postGridLayout.value).toBe("column");
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

    storage.set("favoritesSearch", { query: 3, sortKey: "unknown", isSortAscending: true, allowedRatings: ALL_RATINGS_MASK + 1, shuffleSeed: -1.5 });
    expect(createAppPreferences(storage).favoritesSearch.value).toMatchObject({
      query: "", sortKey: "favorited", isSortAscending: true, allowedRatings: ALL_RATINGS_MASK, shuffleSeed: 0
    });
  });

  test("falls back to the default page size for one below 1", () => {
    const storage = new MemoryLocalKeyedValues();

    storage.set("favoritesPagination", { size: 0, infiniteScroll: true });
    expect(createAppPreferences(storage).favoritesPagination.value).toEqual({ size: 50, infiniteScroll: true });
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
