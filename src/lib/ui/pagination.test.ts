import { describe, expect, test } from "vitest";
import { paginationSequence, paginationUpdateStrategy } from "@/lib/ui/pagination";
import { PaginationTerm } from "@/types/ui";

describe("paginationSequence", () => {
  describe("width 3", () => {
    test("single page collapses to just that page", () => {
      expect(paginationSequence(1, 1, 3)).toEqual([1]);
    });

    test("when every page fits, no bookends or ellipses", () => {
      expect(paginationSequence(1, 3, 3)).toEqual([1, 2, 3]);
      expect(paginationSequence(2, 3, 3)).toEqual([1, 2, 3]);
      expect(paginationSequence(3, 3, 3)).toEqual([1, 2, 3]);
    });

    test("near the start: left side flush, right side gapped", () => {
      expect(paginationSequence(1, 10, 3)).toEqual([1, 2, 3, "ellipsis", 10]);
    });

    test("near the end: right side flush, left side gapped", () => {
      expect(paginationSequence(10, 10, 3)).toEqual([1, "ellipsis", 8, 9, 10]);
    });

    test("in the middle: both sides gapped", () => {
      expect(paginationSequence(5, 10, 3)).toEqual([1, "ellipsis", 4, 5, 6, "ellipsis", 10]);
    });

    test("bookend present but no ellipsis when the gap is a single page", () => {
      expect(paginationSequence(2, 4, 3)).toEqual([1, 2, 3, 4]);
      expect(paginationSequence(3, 5, 3)).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe("width 1", () => {
    test("single page collapses to just that page", () => {
      expect(paginationSequence(1, 1, 1)).toEqual([1]);
    });

    test("only the current page sits between the bookends", () => {
      expect(paginationSequence(5, 10, 1)).toEqual([1, "ellipsis", 5, "ellipsis", 10]);
    });

    test("near the start: no leading ellipsis", () => {
      expect(paginationSequence(2, 10, 1)).toEqual([1, 2, "ellipsis", 10]);
    });

    test("near the end: no trailing ellipsis", () => {
      expect(paginationSequence(9, 10, 1)).toEqual([1, "ellipsis", 9, 10]);
    });
  });

  describe("width 5", () => {
    test("in the middle: five nearby pages, both sides gapped", () => {
      expect(paginationSequence(10, 20, 5)).toEqual([1, "ellipsis", 8, 9, 10, 11, 12, "ellipsis", 20]);
    });

    test("near the start: left side flush", () => {
      expect(paginationSequence(2, 20, 5)).toEqual([1, 2, 3, 4, 5, "ellipsis", 20]);
    });
  });

  describe("width 7", () => {
    test("in the middle: seven nearby pages, both sides gapped", () => {
      expect(paginationSequence(10, 20, 7)).toEqual([1, "ellipsis", 7, 8, 9, 10, 11, 12, 13, "ellipsis", 20]);
    });

    test("window wider than the page count shows every page", () => {
      expect(paginationSequence(3, 5, 7)).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe.each([1, 3, 5, 7])("invariants at window width %i", (width) => {
    test("current page is always inside the sequence", () => {
      for (let finalPage = 1; finalPage <= 20; finalPage += 1) {
        for (let currentPage = 1; currentPage <= finalPage; currentPage += 1) {
          expect(paginationSequence(currentPage, finalPage, width)).toContain(currentPage);
        }
      }
    });

    test("page numbers never repeat", () => {
      for (let finalPage = 1; finalPage <= 20; finalPage += 1) {
        for (let currentPage = 1; currentPage <= finalPage; currentPage += 1) {
          const pages = pageNumbers(currentPage, finalPage, width);

          expect(new Set(pages).size).toBe(pages.length);
        }
      }
    });

    test("page numbers are strictly increasing", () => {
      for (let finalPage = 1; finalPage <= 20; finalPage += 1) {
        for (let currentPage = 1; currentPage <= finalPage; currentPage += 1) {
          const pages = pageNumbers(currentPage, finalPage, width);

          expect(pages).toEqual([...pages].sort((a, b) => a - b));
        }
      }
    });

    test("an ellipsis only stands in for two or more hidden pages", () => {
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
});

describe("paginationUpdateStrategy", () => {
  test("identical sequences are skipped", () => {
    expect(paginationUpdateStrategy([1, 2, 3, 4, "ellipsis", 7], [1, 2, 3, 4, "ellipsis", 7])).toBe("skip");
    expect(paginationUpdateStrategy([1], [1])).toBe("skip");
  });

  describe("same shape patches in place", () => {
    test("streaming bumps only the trailing page (the reported case)", () => {
      expect(paginationUpdateStrategy([1, 2, 3, 4, "ellipsis", 7], [1, 2, 3, 4, "ellipsis", 8])).toBe("patch");
      expect(paginationUpdateStrategy([1, 2, 3, 4, "ellipsis", 8], [1, 2, 3, 4, "ellipsis", 9])).toBe("patch");
      expect(paginationUpdateStrategy([1, 2, 3, 4, "ellipsis", 9], [1, 2, 3, 4, "ellipsis", 10])).toBe("patch");
    });

    test("the middle window slides one page while both ellipses hold", () => {
      expect(paginationUpdateStrategy([1, "ellipsis", 4, 5, 6, "ellipsis", 10], [1, "ellipsis", 5, 6, 7, "ellipsis", 10])).toBe("patch");
    });
  });

  describe("different shape rebuilds", () => {
    test("a trailing ellipsis appears as the collection grows past the window", () => {
      expect(paginationUpdateStrategy([1, 2, 3, 4], [1, 2, 3, 4, "ellipsis", 10])).toBe("rebuild");
    });

    test("length changes", () => {
      expect(paginationUpdateStrategy([1, 2, 3], [1, 2, 3, 4])).toBe("rebuild");
    });

    test("ellipsis moves to a different slot", () => {
      expect(paginationUpdateStrategy([1, 2, "ellipsis", 10], [1, "ellipsis", 9, 10])).toBe("rebuild");
    });

    test("a leading ellipsis appears as the current page moves right", () => {
      expect(paginationUpdateStrategy([1, 2, 3, 4, "ellipsis", 10], [1, "ellipsis", 4, 5, 6, "ellipsis", 10])).toBe("rebuild");
    });
  });
});

function pageNumbers(currentPage: number, finalPage: number, width: number): number[] {
  return paginationSequence(currentPage, finalPage, width).filter((term: PaginationTerm): term is number => term !== "ellipsis");
}
