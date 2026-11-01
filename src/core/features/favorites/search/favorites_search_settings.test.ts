import { DEFAULT_FAVORITES_SEARCH_SETTINGS, FAVORITES_SEARCH_SETTINGS_GUARDS, isFilteringFavoritesSearchSettings } from "@/core/features/favorites/search/favorites_search_settings";
import { describe, expect, test } from "vitest";

describe("isFilteringFavoritesSearchSettings", () => {
  test("returns false for the default settings", () => {
    expect(isFilteringFavoritesSearchSettings(DEFAULT_FAVORITES_SEARCH_SETTINGS)).toBe(false);
  });

  test("returns true when a filter differs from its default", () => {
    expect(isFilteringFavoritesSearchSettings({ ...DEFAULT_FAVORITES_SEARCH_SETTINGS, query: "apple" })).toBe(true);
    expect(isFilteringFavoritesSearchSettings({ ...DEFAULT_FAVORITES_SEARCH_SETTINGS, isInverted: true })).toBe(true);
    expect(isFilteringFavoritesSearchSettings({ ...DEFAULT_FAVORITES_SEARCH_SETTINGS, allowedRatings: 1 })).toBe(true);
    expect(isFilteringFavoritesSearchSettings({ ...DEFAULT_FAVORITES_SEARCH_SETTINGS, isBlacklistEnabled: true })).toBe(true);
  });

  test("ignores ordering settings", () => {
    expect(isFilteringFavoritesSearchSettings({
      ...DEFAULT_FAVORITES_SEARCH_SETTINGS, sortKey: "score", isSortAscending: true, isShuffled: true, shuffleSeed: 7
    })).toBe(false);
  });
});

describe("FAVORITES_SEARCH_SETTINGS_GUARDS", () => {
  test("accepts every default setting", () => {
    for (const [key, accepts] of Object.entries(FAVORITES_SEARCH_SETTINGS_GUARDS)) {
      expect(accepts(DEFAULT_FAVORITES_SEARCH_SETTINGS[key as keyof typeof DEFAULT_FAVORITES_SEARCH_SETTINGS])).toBe(true);
    }
  });

  test("rejects an unknown sort key", () => {
    expect(FAVORITES_SEARCH_SETTINGS_GUARDS.sortKey("tags")).toBe(false);
  });

  test("accepts only a non-negative integer seed", () => {
    expect(FAVORITES_SEARCH_SETTINGS_GUARDS.shuffleSeed(42)).toBe(true);
    expect(FAVORITES_SEARCH_SETTINGS_GUARDS.shuffleSeed(-1)).toBe(false);
    expect(FAVORITES_SEARCH_SETTINGS_GUARDS.shuffleSeed(1.5)).toBe(false);
    expect(FAVORITES_SEARCH_SETTINGS_GUARDS.shuffleSeed("1")).toBe(false);
  });
});
