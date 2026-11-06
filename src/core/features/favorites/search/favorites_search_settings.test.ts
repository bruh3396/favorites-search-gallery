import {
  DEFAULT_FAVORITES_SEARCH_SETTINGS, FAVORITES_SEARCH_SETTINGS_GUARDS, countChangedFavoritesSearchSettings, isFilteringFavoritesSearchSettings
} from "@/core/features/favorites/search/favorites_search_settings";
import { describe, expect, test } from "vitest";

describe("countChangedFavoritesSearchSettings", () => {
  test("counts nothing for the default settings", () => {
    expect(countChangedFavoritesSearchSettings(DEFAULT_FAVORITES_SEARCH_SETTINGS)).toBe(0);
  });

  test("leaves out the query and the seed", () => {
    expect(countChangedFavoritesSearchSettings({ ...DEFAULT_FAVORITES_SEARCH_SETTINGS, query: "apple", shuffleSeed: 7 })).toBe(0);
  });

  test.each([
    { change: { sortKey: "score" } },
    { change: { isSortAscending: true } },
    { change: { isShuffled: true } },
    { change: { isInverted: true } },
    { change: { isBlacklistEnabled: true } },
    { change: { allowedStatuses: 1 } },
    { change: { allowedRatings: 1 } }
  ] as const)("counts $change as one change", ({ change }) => {
    expect(countChangedFavoritesSearchSettings({ ...DEFAULT_FAVORITES_SEARCH_SETTINGS, ...change })).toBe(1);
  });

  test("counts the sort key and its direction as one change", () => {
    expect(countChangedFavoritesSearchSettings({ ...DEFAULT_FAVORITES_SEARCH_SETTINGS, sortKey: "score", isSortAscending: true })).toBe(1);
  });

  test("adds up every changed filter", () => {
    expect(countChangedFavoritesSearchSettings({
      ...DEFAULT_FAVORITES_SEARCH_SETTINGS,
      sortKey: "score",
      isShuffled: true,
      isInverted: true,
      isBlacklistEnabled: true,
      allowedStatuses: 1,
      allowedRatings: 1
    })).toBe(6);
  });
});

describe("isFilteringFavoritesSearchSettings", () => {
  test("returns false for the default settings", () => {
    expect(isFilteringFavoritesSearchSettings(DEFAULT_FAVORITES_SEARCH_SETTINGS)).toBe(false);
  });

  test("returns true when a filter differs from its default", () => {
    expect(isFilteringFavoritesSearchSettings({ ...DEFAULT_FAVORITES_SEARCH_SETTINGS, query: "apple" })).toBe(true);
    expect(isFilteringFavoritesSearchSettings({ ...DEFAULT_FAVORITES_SEARCH_SETTINGS, isInverted: true })).toBe(true);
    expect(isFilteringFavoritesSearchSettings({ ...DEFAULT_FAVORITES_SEARCH_SETTINGS, allowedRatings: 1 })).toBe(true);
    expect(isFilteringFavoritesSearchSettings({ ...DEFAULT_FAVORITES_SEARCH_SETTINGS, allowedStatuses: 1 })).toBe(true);
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
