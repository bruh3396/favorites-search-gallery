import { describe, expect, test } from "vitest";
import { describeFavoritesLoadState } from "@/core/features/favorites/load/favorites_load_state_describer";

describe("describeFavoritesLoadState", () => {
  test("names each step of the load", () => {
    expect(describeFavoritesLoadState({ phase: "starting" })).toBe("Starting");
    expect(describeFavoritesLoadState({ phase: "preparing" })).toBe("Preparing, can take a minute after an update");
    expect(describeFavoritesLoadState({ phase: "saving" })).toBe("Saving");
    expect(describeFavoritesLoadState({ phase: "pulling" })).toBe("Checking for new");
    expect(describeFavoritesLoadState({ phase: "indexing" })).toBe("Indexing");
    expect(describeFavoritesLoadState({ phase: "checkingMissing" })).toBe("Syncing");
    expect(describeFavoritesLoadState({ phase: "interrupted" })).toBe("Couldn't finish loading");
  });

  test("counts fetched favorites against the expected count", () => {
    expect(describeFavoritesLoadState({ phase: "fetching", loadedCount: 300, expectedCount: 600 })).toBe("Fetching 300 / 600");
  });

  test("counts fetched favorites alone before the expected count arrives", () => {
    expect(describeFavoritesLoadState({ phase: "fetching", loadedCount: 300, expectedCount: null })).toBe("Fetching 300");
  });

  test("counts restored favorites against the stored count", () => {
    expect(describeFavoritesLoadState({ phase: "restoring", loadedCount: 50, expectedCount: 200 })).toBe("Loading 50 / 200");
  });

  test("groups the digits of large counts", () => {
    expect(describeFavoritesLoadState({ phase: "fetching", loadedCount: 12_400, expectedCount: 50_021 }))
      .toBe(`Fetching ${(12_400).toLocaleString()} / ${(50_021).toLocaleString()}`);
    expect(describeFavoritesLoadState({ phase: "loaded", newCount: 1_200, unfavoritedCount: 0 })).toBe(`${(1_200).toLocaleString()} new`);
  });

  test("reports what the sync changed once loaded", () => {
    expect(describeFavoritesLoadState({ phase: "loaded", newCount: 3, unfavoritedCount: 1 })).toBe("3 new, 1 removed");
    expect(describeFavoritesLoadState({ phase: "loaded", newCount: 3, unfavoritedCount: 0 })).toBe("3 new");
  });

  test("says nothing once loaded without changes", () => {
    expect(describeFavoritesLoadState({ phase: "loaded", newCount: 0, unfavoritedCount: 0 })).toBe("");
  });
});
