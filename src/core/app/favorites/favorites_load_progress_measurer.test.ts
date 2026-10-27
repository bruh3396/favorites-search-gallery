import { describe, expect, test } from "vitest";
import { FavoritesLoadState } from "@/core/features/favorites/load/favorites_load_state";
import { measureFavoritesLoadProgress } from "@/core/app/favorites/favorites_load_progress_measurer";

describe("measureFavoritesLoadProgress", () => {
  test.each([
    { state: { phase: "fetching", loadedCount: 150, expectedCount: 600 }, progress: 0.25 },
    { state: { phase: "restoring", loadedCount: 300, expectedCount: 600 }, progress: 0.5 }
  ] satisfies { state: FavoritesLoadState; progress: number }[])("measures the share counted so far while $state.phase", ({ state, progress }) => {
    expect(measureFavoritesLoadProgress(state)).toBe(progress);
  });

  test.each([
    { phase: "fetching", loadedCount: 150, expectedCount: null },
    { phase: "restoring", loadedCount: 0, expectedCount: 0 },
    ...(["starting", "saving", "pulling", "indexing", "checkingMissing"] as const).map(phase => ({ phase }))
  ] satisfies FavoritesLoadState[])("is indeterminate while $phase without a share", state => {
    expect(measureFavoritesLoadProgress(state)).toBe("indeterminate");
  });

  test.each([
    { phase: "loaded", newCount: 0, unfavoritedCount: 0 },
    { phase: "interrupted" }
  ] satisfies FavoritesLoadState[])("is idle once $phase", state => {
    expect(measureFavoritesLoadProgress(state)).toBe("idle");
  });
});
