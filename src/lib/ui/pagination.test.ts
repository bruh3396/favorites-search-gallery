import { describe, expect, test } from "vitest";
import { PaginationTerm } from "@/types/ui";
import { paginationSequence } from "@/lib/ui/pagination";

const WIDTHS = [1, 3, 5, 7];

function listPageNumbers(currentPage: number, finalPage: number, width: number): number[] {
  return paginationSequence(currentPage, finalPage, width).filter((term: PaginationTerm): term is number => term !== "ellipsis");
}

describe("paginationSequence", () => {
  test.each([1, 3])("collapses a single page to just that page at width %i", width => {
    expect(paginationSequence(1, 1, width)).toEqual([1]);
  });

  test("lists every page without bookends or ellipses when they all fit", () => {
    expect(paginationSequence(1, 3, 3)).toEqual([1, 2, 3]);
    expect(paginationSequence(2, 3, 3)).toEqual([1, 2, 3]);
    expect(paginationSequence(3, 3, 3)).toEqual([1, 2, 3]);
  });

  test("keeps the left side flush and gaps the right near the start", () => {
    expect(paginationSequence(1, 10, 3)).toEqual([1, 2, 3, "ellipsis", 10]);
    expect(paginationSequence(2, 20, 5)).toEqual([1, 2, 3, 4, 5, "ellipsis", 20]);
  });

  test("keeps the right side flush and gaps the left near the end", () => {
    expect(paginationSequence(10, 10, 3)).toEqual([1, "ellipsis", 8, 9, 10]);
  });

  test("gaps both sides in the middle", () => {
    expect(paginationSequence(5, 10, 3)).toEqual([1, "ellipsis", 4, 5, 6, "ellipsis", 10]);
    expect(paginationSequence(10, 20, 5)).toEqual([1, "ellipsis", 8, 9, 10, 11, 12, "ellipsis", 20]);
    expect(paginationSequence(10, 20, 7)).toEqual([1, "ellipsis", 7, 8, 9, 10, 11, 12, 13, "ellipsis", 20]);
  });

  test("shows the bookend without an ellipsis when the gap is a single page", () => {
    expect(paginationSequence(2, 4, 3)).toEqual([1, 2, 3, 4]);
    expect(paginationSequence(3, 5, 3)).toEqual([1, 2, 3, 4, 5]);
  });

  test("puts only the current page between the bookends at width 1", () => {
    expect(paginationSequence(5, 10, 1)).toEqual([1, "ellipsis", 5, "ellipsis", 10]);
  });

  test("drops the leading ellipsis near the start at width 1", () => {
    expect(paginationSequence(2, 10, 1)).toEqual([1, 2, "ellipsis", 10]);
  });

  test("drops the trailing ellipsis near the end at width 1", () => {
    expect(paginationSequence(9, 10, 1)).toEqual([1, "ellipsis", 9, 10]);
  });

  test("shows every page when the window is wider than the page count", () => {
    expect(paginationSequence(3, 5, 7)).toEqual([1, 2, 3, 4, 5]);
  });

  test.each(WIDTHS)("always includes the current page at width %i", width => {
    for (let finalPage = 1; finalPage <= 20; finalPage += 1) {
      for (let currentPage = 1; currentPage <= finalPage; currentPage += 1) {
        expect(paginationSequence(currentPage, finalPage, width)).toContain(currentPage);
      }
    }
  });

  test.each(WIDTHS)("never repeats a page number at width %i", width => {
    for (let finalPage = 1; finalPage <= 20; finalPage += 1) {
      for (let currentPage = 1; currentPage <= finalPage; currentPage += 1) {
        const pages = listPageNumbers(currentPage, finalPage, width);

        expect(new Set(pages).size).toBe(pages.length);
      }
    }
  });

  test.each(WIDTHS)("lists page numbers in increasing order at width %i", width => {
    for (let finalPage = 1; finalPage <= 20; finalPage += 1) {
      for (let currentPage = 1; currentPage <= finalPage; currentPage += 1) {
        const pages = listPageNumbers(currentPage, finalPage, width);

        expect(pages).toEqual([...pages].sort((a, b) => a - b));
      }
    }
  });

  test.each(WIDTHS)("uses an ellipsis only for two or more hidden pages at width %i", width => {
    for (let finalPage = 1; finalPage <= 30; finalPage += 1) {
      for (let currentPage = 1; currentPage <= finalPage; currentPage += 1) {
        const sequence = paginationSequence(currentPage, finalPage, width);

        sequence.forEach((term: PaginationTerm, index: number) => {
          if (term === "ellipsis") {
            const before = sequence[index - 1];
            const after = sequence[index + 1];

            expect(typeof before).toBe("number");
            expect(typeof after).toBe("number");
            expect((after as number) - (before as number)).toBeGreaterThanOrEqual(2);
          }
        });
      }
    }
  });
});
