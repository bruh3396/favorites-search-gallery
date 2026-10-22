import { describe, expect, test } from "vitest";
import { describeLoadState } from "@/core/features/favorites/load/status";

describe("describeLoadState", () => {
  test("names each step of the load", () => {
    expect(describeLoadState({ phase: "starting" })).toBe("Starting");
    expect(describeLoadState({ phase: "saving" })).toBe("Saving");
    expect(describeLoadState({ phase: "pulling" })).toBe("Checking for new");
    expect(describeLoadState({ phase: "indexing" })).toBe("Indexing");
    expect(describeLoadState({ phase: "pruning" })).toBe("Checking for removed");
    expect(describeLoadState({ phase: "interrupted" })).toBe("Couldn't finish loading");
  });

  test("counts fetched favorites against the expected count", () => {
    expect(describeLoadState({ phase: "fetching", loadedCount: 300, expectedCount: 600 })).toBe("Fetching 300 / 600");
  });

  test("counts fetched favorites alone before the expected count arrives", () => {
    expect(describeLoadState({ phase: "fetching", loadedCount: 300, expectedCount: null })).toBe("Fetching 300");
  });

  test("counts restored favorites against the stored count", () => {
    expect(describeLoadState({ phase: "restoring", loadedCount: 50, expectedCount: 200 })).toBe("Loading 50 / 200");
  });

  test("groups the digits of large counts", () => {
    expect(describeLoadState({ phase: "fetching", loadedCount: 12_400, expectedCount: 50_021 }))
      .toBe(`Fetching ${(12_400).toLocaleString()} / ${(50_021).toLocaleString()}`);
    expect(describeLoadState({ phase: "loaded", pulledCount: 1_200, removedCount: 0 })).toBe(`${(1_200).toLocaleString()} new`);
  });

  test("reports what the sync changed once loaded", () => {
    expect(describeLoadState({ phase: "loaded", pulledCount: 3, removedCount: 1 })).toBe("3 new, 1 removed");
    expect(describeLoadState({ phase: "loaded", pulledCount: 3, removedCount: 0 })).toBe("3 new");
  });

  test("says nothing once loaded without changes", () => {
    expect(describeLoadState({ phase: "loaded", pulledCount: 0, removedCount: 0 })).toBe("");
  });
});
