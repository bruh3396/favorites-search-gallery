import { describe, expect, test } from "vitest";
import { FavoritesLoadState } from "@/core/features/favorites/load/favorites_load_state";
import { measureFavoritesLoadProgress } from "@/core/app/favorites/favorites_load_progress_measurer";

describe("measureFavoritesLoadProgress", () => {
  test.each([
    { favoritesLoadState: { phase: "fetching", loadedCount: 150, expectedCount: 600 }, progress: 0.25 },
    { favoritesLoadState: { phase: "restoring", loadedCount: 300, expectedCount: 600 }, progress: 0.5 }
  ] satisfies { favoritesLoadState: FavoritesLoadState; progress: number }[])(
    "measures the share counted so far while $favoritesLoadState.phase",
    ({ favoritesLoadState, progress }) => {
      expect(measureFavoritesLoadProgress(favoritesLoadState)).toBe(progress);
    }
  );

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
