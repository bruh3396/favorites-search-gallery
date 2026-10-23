import { DEFAULT_SEARCH_SETTINGS, SEARCH_SETTINGS_GUARDS, isFiltered } from "@/core/features/favorites/search/inputs";
import { describe, expect, test } from "vitest";

describe("isFiltered", () => {
  test("returns false for the default settings", () => {
    expect(isFiltered(DEFAULT_SEARCH_SETTINGS)).toBe(false);
  });

  test("returns true when a filter differs from its default", () => {
    expect(isFiltered({ ...DEFAULT_SEARCH_SETTINGS, query: "apple" })).toBe(true);
    expect(isFiltered({ ...DEFAULT_SEARCH_SETTINGS, isInverted: true })).toBe(true);
    expect(isFiltered({ ...DEFAULT_SEARCH_SETTINGS, allowedRatings: 1 })).toBe(true);
    expect(isFiltered({ ...DEFAULT_SEARCH_SETTINGS, isBlacklistEnabled: true })).toBe(true);
  });

  test("ignores ordering settings", () => {
    expect(isFiltered({ ...DEFAULT_SEARCH_SETTINGS, sortKey: "score", isSortAscending: true, isShuffled: true, shuffleSeed: 7 })).toBe(false);
  });
});

describe("SEARCH_SETTINGS_GUARDS", () => {
  test("accepts every default setting", () => {
    for (const [key, accepts] of Object.entries(SEARCH_SETTINGS_GUARDS)) {
      expect(accepts(DEFAULT_SEARCH_SETTINGS[key as keyof typeof DEFAULT_SEARCH_SETTINGS])).toBe(true);
    }
  });

  test("rejects an unknown sort key", () => {
    expect(SEARCH_SETTINGS_GUARDS.sortKey("tags")).toBe(false);
  });

  test("accepts only a non-negative integer seed", () => {
    expect(SEARCH_SETTINGS_GUARDS.shuffleSeed(42)).toBe(true);
    expect(SEARCH_SETTINGS_GUARDS.shuffleSeed(-1)).toBe(false);
    expect(SEARCH_SETTINGS_GUARDS.shuffleSeed(1.5)).toBe(false);
    expect(SEARCH_SETTINGS_GUARDS.shuffleSeed("1")).toBe(false);
  });
});
