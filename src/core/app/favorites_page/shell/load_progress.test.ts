import { describe, expect, test } from "vitest";
import { measureLoadProgress } from "@/core/app/favorites_page/shell/load_progress";

describe("measureLoadProgress", () => {
  test("returns the share counted so far while fetching or restoring", () => {
    expect(measureLoadProgress({ phase: "fetching", loadedCount: 150, expectedCount: 600 })).toBe(0.25);
    expect(measureLoadProgress({ phase: "restoring", loadedCount: 300, expectedCount: 600 })).toBe(0.5);
  });

  test("returns indeterminate while the expected count is unknown or zero", () => {
    expect(measureLoadProgress({ phase: "fetching", loadedCount: 150, expectedCount: null })).toBe("indeterminate");
    expect(measureLoadProgress({ phase: "restoring", loadedCount: 0, expectedCount: 0 })).toBe("indeterminate");
  });

  test("returns indeterminate while starting, saving or checking", () => {
    const phases = ["starting", "saving", "pulling", "indexing", "pruning"] as const;

    expect(phases.map(phase => measureLoadProgress({ phase }))).toEqual(phases.map(() => "indeterminate"));
  });

  test("returns idle once loaded or interrupted", () => {
    expect(measureLoadProgress({ phase: "loaded", pulledCount: 0, removedCount: 0 })).toBe("idle");
    expect(measureLoadProgress({ phase: "interrupted" })).toBe("idle");
  });
});
