import { describe, expect, test } from "vitest";
import { isSearchableMetadataMetric, searchableMetrics } from "@/lib/search/vocabulary";

describe("searchableMetrics", () => {
  test("lists the metrics a search term can compare", () => {
    expect([...searchableMetrics].sort()).toStrictEqual(["duration", "height", "id", "score", "width"]);
  });
});

describe("isSearchableMetadataMetric", () => {
  test("accepts every searchable metric", () => {
    for (const metric of searchableMetrics) {
      expect(isSearchableMetadataMetric(metric)).toBe(true);
    }
  });

  test("rejects sort-only metrics", () => {
    expect(isSearchableMetadataMetric("default")).toBe(false);
    expect(isSearchableMetadataMetric("random")).toBe(false);
    expect(isSearchableMetadataMetric("creationTimestamp")).toBe(false);
    expect(isSearchableMetadataMetric("lastChangedTimestamp")).toBe(false);
  });

  test("rejects numbers, casing variants, and non-strings", () => {
    expect(isSearchableMetadataMetric("100")).toBe(false);
    expect(isSearchableMetadataMetric("Score")).toBe(false);
    expect(isSearchableMetadataMetric(100)).toBe(false);
    expect(isSearchableMetadataMetric(undefined)).toBe(false);
  });
});
