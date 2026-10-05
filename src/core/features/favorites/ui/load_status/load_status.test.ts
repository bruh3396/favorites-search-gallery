import { describe, expect, test } from "vitest";
import { describeLoadState } from "@/core/features/favorites/ui/load_status/load_status";

describe("describeLoadState", () => {
  test("names each step of the load", () => {
    expect(describeLoadState({ phase: "starting" })).toBe("Starting");
    expect(describeLoadState({ phase: "saving" })).toBe("Saving favorites");
    expect(describeLoadState({ phase: "pulling" })).toBe("Checking for new favorites");
    expect(describeLoadState({ phase: "indexing" })).toBe("Indexing favorites");
    expect(describeLoadState({ phase: "pruning" })).toBe("Checking for removed favorites");
    expect(describeLoadState({ phase: "interrupted" })).toBe("Couldn't finish loading favorites");
  });

  test("counts fetched favorites against the expected count", () => {
    expect(describeLoadState({ phase: "fetching", loadedCount: 300, expectedCount: 600 })).toBe("Fetching favorites: 300 / 600");
  });

  test("counts fetched favorites alone before the expected count arrives", () => {
    expect(describeLoadState({ phase: "fetching", loadedCount: 300, expectedCount: null })).toBe("Fetching favorites: 300");
  });

  test("counts restored favorites against the stored count", () => {
    expect(describeLoadState({ phase: "restoring", loadedCount: 50, expectedCount: 200 })).toBe("Loading favorites: 50 / 200");
  });

  test("reports what the sync changed once loaded", () => {
    expect(describeLoadState({ phase: "loaded", pulledCount: 3, removedCount: 1 })).toBe("3 new, 1 removed");
    expect(describeLoadState({ phase: "loaded", pulledCount: 3, removedCount: 0 })).toBe("3 new");
  });

  test("says nothing once loaded without changes", () => {
    expect(describeLoadState({ phase: "loaded", pulledCount: 0, removedCount: 0 })).toBe("");
  });
});
