import { describe, expect, test } from "vitest";
import { Favorite } from "@/core/features/favorites/favorite";
import { paginate } from "@/core/features/favorites/search/pagination";

const NUMBERED = { size: 50, infiniteScroll: false };
const INFINITE = { size: 50, infiniteScroll: true };

function createResults(count: number): Favorite[] {
  return Array.from({ length: count }, (_, index): Favorite => ({
    id: String(index + 1), media: { kind: "image", locator: "" }, isNew: false, ratingBit: 0, tags: new Set(), getMetric: () => 0
  }));
}

describe("paginate", () => {
  test.each([
    { pageNumber: 1, start: 0, end: 50 },
    { pageNumber: 2, start: 50, end: 100 },
    { pageNumber: 3, start: 100, end: 120 }
  ])("shows page $pageNumber of the numbered pages", ({ pageNumber, start, end }) => {
    const results = createResults(120);

    expect(paginate(NUMBERED, results, pageNumber)).toEqual({ favorites: results.slice(start, end), pageNumber, totalPages: 3, totalResults: 120 });
  });

  test.each([
    { pageNumber: 1, end: 25 },
    { pageNumber: 2, end: 50 },
    { pageNumber: 3, end: 60 }
  ])("shows the first $pageNumber pages of 25 while scrolling infinitely", ({ pageNumber, end }) => {
    const results = createResults(60);

    expect(paginate(INFINITE, results, pageNumber)).toEqual({ favorites: results.slice(0, end), pageNumber, totalPages: 3, totalResults: 60 });
  });

  test.each([NUMBERED, INFINITE])("shows one empty page when there is nothing to show", settings => {
    expect(paginate(settings, [], 2)).toEqual({ favorites: [], pageNumber: 1, totalPages: 1, totalResults: 0 });
  });

  test("treats a page size below one as one", () => {
    const results = createResults(3);

    expect(paginate({ size: 0, infiniteScroll: false }, results, 2)).toEqual({ favorites: [results[1]], pageNumber: 2, totalPages: 3, totalResults: 3 });
  });

  test.each([
    { pageNumber: 0, current: 1 },
    { pageNumber: -3, current: 1 },
    { pageNumber: 4, current: 3 }
  ])("clamps page $pageNumber to page $current", ({ pageNumber, current }) => {
    expect(paginate(NUMBERED, createResults(120), pageNumber).pageNumber).toBe(current);
  });
});
