import { describe, expect, test } from "vitest";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";
import { RATINGS } from "@/core/domain/post/post";
import { createFavoritesPreferences } from "@/core/app/favorites_page/preferences";

describe("createFavoritesPreferences", () => {
  test("starts from the defaults when nothing is stored", () => {
    const preferences = createFavoritesPreferences(new MemoryLocalKeyedValues());

    expect(preferences.sort.value).toEqual({ key: "favorited", isAscending: false });
    expect(preferences.allowedRatings.value).toEqual(new Set(RATINGS));
    expect(preferences.isBlacklistEnabled.value).toBe(false);
    expect(preferences.resultsPerPage.value).toBe(50);
    expect(preferences.isInfiniteScrollEnabled.value).toBe(false);
  });

  test("reads the settings kept in the store", () => {
    const store = new MemoryLocalKeyedValues();

    store.set("favoritesSort", { key: "random", isAscending: true });
    store.set("favoritesAllowedRatings", ["safe"]);
    expect(createFavoritesPreferences(store).sort.value).toEqual({ key: "random", isAscending: true });
    expect(createFavoritesPreferences(store).allowedRatings.value).toEqual(new Set(["safe"]));
  });

  test("falls back to the default sort when the stored one is unknown", () => {
    const store = new MemoryLocalKeyedValues();

    store.set("favoritesSort", { key: "unknown", isAscending: true });
    expect(createFavoritesPreferences(store).sort.value).toEqual({ key: "favorited", isAscending: false });
  });

  test("stores the allowed ratings as a list", () => {
    const store = new MemoryLocalKeyedValues();

    createFavoritesPreferences(store).allowedRatings.set(new Set(["safe"]));
    expect(store.get("favoritesAllowedRatings")).toEqual(["safe"]);
  });
});
