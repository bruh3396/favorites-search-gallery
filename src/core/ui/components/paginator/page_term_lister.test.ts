import { describe, expect, test } from "vitest";
import { PageTerm } from "@/core/ui/components/paginator/page_term";
import { listPageTerms } from "@/core/ui/components/paginator/page_term_lister";

const SLOT_COUNTS = [5, 6, 7, 9];

interface Sequence {
  pageNumber: number;
  pageCount: number;
  pageTerms: readonly PageTerm[];
}

function listSequences(slotCount: number): Sequence[] {
  const sequences: Sequence[] = [];

  for (let pageCount = 1; pageCount <= 30; pageCount += 1) {
    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      sequences.push({ pageNumber, pageCount, pageTerms: listPageTerms({ pageNumber, pageCount, slotCount }) });
    }
  }
  return sequences;
}

function listPageNumbers(pageTerms: readonly PageTerm[]): number[] {
  return pageTerms.filter((pageTerm): pageTerm is number => pageTerm !== "gap");
}

describe("listPageTerms", () => {
  test("lists a single page alone", () => {
    expect(listPageTerms({ pageNumber: 1, pageCount: 1, slotCount: 7 })).toEqual([1]);
  });

  test("lists nothing when there are no pages", () => {
    expect(listPageTerms({ pageNumber: 1, pageCount: 0, slotCount: 7 })).toEqual([]);
  });

  test("lists every page without gaps when they all fit", () => {
    expect(listPageTerms({ pageNumber: 2, pageCount: 3, slotCount: 7 })).toEqual([1, 2, 3]);
    expect(listPageTerms({ pageNumber: 3, pageCount: 7, slotCount: 7 })).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  test("runs pages from the start before a single gap near the start", () => {
    expect(listPageTerms({ pageNumber: 1, pageCount: 296, slotCount: 7 })).toEqual([1, 2, 3, 4, 5, "gap", 296]);
    expect(listPageTerms({ pageNumber: 4, pageCount: 296, slotCount: 7 })).toEqual([1, 2, 3, 4, 5, "gap", 296]);
  });

  test("runs pages to the end after a single gap near the end", () => {
    expect(listPageTerms({ pageNumber: 296, pageCount: 296, slotCount: 7 })).toEqual([1, "gap", 292, 293, 294, 295, 296]);
    expect(listPageTerms({ pageNumber: 293, pageCount: 296, slotCount: 7 })).toEqual([1, "gap", 292, 293, 294, 295, 296]);
  });

  test("gaps both sides in the middle", () => {
    expect(listPageTerms({ pageNumber: 5, pageCount: 296, slotCount: 7 })).toEqual([1, "gap", 4, 5, 6, "gap", 296]);
    expect(listPageTerms({ pageNumber: 150, pageCount: 296, slotCount: 7 })).toEqual([1, "gap", 149, 150, 151, "gap", 296]);
  });

  test.each(SLOT_COUNTS)("always lists the current page with %i slots", slotCount => {
    for (const { pageNumber, pageTerms } of listSequences(slotCount)) {
      expect(pageTerms).toContain(pageNumber);
    }
  });

  test.each(SLOT_COUNTS)("fills every slot once pages outnumber %i slots", slotCount => {
    for (const { pageCount, pageTerms } of listSequences(slotCount)) {
      expect(pageTerms).toHaveLength(Math.min(pageCount, slotCount));
    }
  });

  test.each(SLOT_COUNTS)("lists page numbers once each, in increasing order, with %i slots", slotCount => {
    for (const { pageTerms } of listSequences(slotCount)) {
      const pages = listPageNumbers(pageTerms);

      expect(pages).toEqual([...new Set(pages)].sort((a, b) => a - b));
    }
  });

  test.each(SLOT_COUNTS)("puts a gap only where two or more pages are hidden with %i slots", slotCount => {
    for (const { pageTerms } of listSequences(slotCount)) {
      pageTerms.forEach((pageTerm, index) => {
        if (pageTerm === "gap") {
          expect((pageTerms[index + 1] as number) - (pageTerms[index - 1] as number)).toBeGreaterThan(2);
        }
      });
    }
  });
});
