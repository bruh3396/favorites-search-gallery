import {
  DEFAULT_FAVORITES_SEARCH_OPTIONS, FAVORITES_SEARCH_OPTIONS_GUARDS, countChangedFavoritesSearchOptions, isFilteringFavoritesSearchOptions,
  isReorderingFavoritesSearchOptions
} from "@/core/features/favorites/search/favorites_search_options";
import { describe, expect, test } from "vitest";

describe("countChangedFavoritesSearchOptions", () => {
  test("counts nothing for the default options", () => {
    expect(countChangedFavoritesSearchOptions(DEFAULT_FAVORITES_SEARCH_OPTIONS)).toBe(0);
  });

  test("leaves out the query and the seed", () => {
    expect(countChangedFavoritesSearchOptions({ ...DEFAULT_FAVORITES_SEARCH_OPTIONS, query: "apple", shuffleSeed: 7 })).toBe(0);
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
    expect(countChangedFavoritesSearchOptions({ ...DEFAULT_FAVORITES_SEARCH_OPTIONS, ...change })).toBe(1);
  });

  test("counts the sort key and its direction as one change", () => {
    expect(countChangedFavoritesSearchOptions({ ...DEFAULT_FAVORITES_SEARCH_OPTIONS, sortKey: "score", isSortAscending: true })).toBe(1);
  });

  test("adds up every changed option", () => {
    expect(countChangedFavoritesSearchOptions({
      ...DEFAULT_FAVORITES_SEARCH_OPTIONS,
      sortKey: "score",
      isShuffled: true,
      isInverted: true,
      isBlacklistEnabled: true,
      allowedStatuses: 1,
      allowedRatings: 1
    })).toBe(6);
  });
});

describe("isFilteringFavoritesSearchOptions", () => {
  test("returns false for the default options", () => {
    expect(isFilteringFavoritesSearchOptions(DEFAULT_FAVORITES_SEARCH_OPTIONS)).toBe(false);
  });

  test("returns true when a filter differs from its default", () => {
    expect(isFilteringFavoritesSearchOptions({ ...DEFAULT_FAVORITES_SEARCH_OPTIONS, query: "apple" })).toBe(true);
    expect(isFilteringFavoritesSearchOptions({ ...DEFAULT_FAVORITES_SEARCH_OPTIONS, isInverted: true })).toBe(true);
    expect(isFilteringFavoritesSearchOptions({ ...DEFAULT_FAVORITES_SEARCH_OPTIONS, allowedRatings: 1 })).toBe(true);
    expect(isFilteringFavoritesSearchOptions({ ...DEFAULT_FAVORITES_SEARCH_OPTIONS, allowedStatuses: 1 })).toBe(true);
    expect(isFilteringFavoritesSearchOptions({ ...DEFAULT_FAVORITES_SEARCH_OPTIONS, isBlacklistEnabled: true })).toBe(true);
  });

  test("ignores ordering options", () => {
    expect(isFilteringFavoritesSearchOptions({
      ...DEFAULT_FAVORITES_SEARCH_OPTIONS, sortKey: "score", isSortAscending: true, isShuffled: true, shuffleSeed: 7
    })).toBe(false);
  });
});

describe("isReorderingFavoritesSearchOptions", () => {
  test("returns false for the default options", () => {
    expect(isReorderingFavoritesSearchOptions(DEFAULT_FAVORITES_SEARCH_OPTIONS)).toBe(false);
  });

  test.each([
    { change: { sortKey: "score" } },
    { change: { isSortAscending: true } },
    { change: { isShuffled: true } }
  ] as const)("returns true after changing $change", ({ change }) => {
    expect(isReorderingFavoritesSearchOptions({ ...DEFAULT_FAVORITES_SEARCH_OPTIONS, ...change })).toBe(true);
  });

  test("ignores filters", () => {
    const filteredFavoritesSearchOptions = { ...DEFAULT_FAVORITES_SEARCH_OPTIONS, query: "apple", isInverted: true };

    expect(isReorderingFavoritesSearchOptions(filteredFavoritesSearchOptions)).toBe(false);
  });
});

describe("FAVORITES_SEARCH_OPTIONS_GUARDS", () => {
  test("accepts every default option", () => {
    for (const [key, accepts] of Object.entries(FAVORITES_SEARCH_OPTIONS_GUARDS)) {
      expect(accepts(DEFAULT_FAVORITES_SEARCH_OPTIONS[key as keyof typeof DEFAULT_FAVORITES_SEARCH_OPTIONS])).toBe(true);
    }
  });

  test("rejects an unknown sort key", () => {
    expect(FAVORITES_SEARCH_OPTIONS_GUARDS.sortKey("tags")).toBe(false);
  });

  test("accepts only a non-negative integer seed", () => {
    expect(FAVORITES_SEARCH_OPTIONS_GUARDS.shuffleSeed(42)).toBe(true);
    expect(FAVORITES_SEARCH_OPTIONS_GUARDS.shuffleSeed(-1)).toBe(false);
    expect(FAVORITES_SEARCH_OPTIONS_GUARDS.shuffleSeed(1.5)).toBe(false);
    expect(FAVORITES_SEARCH_OPTIONS_GUARDS.shuffleSeed("1")).toBe(false);
  });
});
