import { PageTerm, getPageSequence } from "@/core/ui/components/paginator/page_sequence";
import { describe, expect, test } from "vitest";

const NEARBY_COUNTS = [1, 3, 5, 7];

function listSequences(nearbyCount: number): (readonly PageTerm[])[] {
  const sequences: (readonly PageTerm[])[] = [];

  for (let pageCount = 1; pageCount <= 30; pageCount += 1) {
    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      sequences.push(getPageSequence({ pageNumber, pageCount, nearbyCount }));
    }
  }
  return sequences;
}

function listPageNumbers(sequence: readonly PageTerm[]): number[] {
  return sequence.filter((term): term is number => term !== "gap");
}

describe("getPageSequence", () => {
  test("lists a single page alone", () => {
    expect(getPageSequence({ pageNumber: 1, pageCount: 1, nearbyCount: 5 })).toEqual([1]);
  });

  test("lists every page without gaps when they all fit", () => {
    expect(getPageSequence({ pageNumber: 2, pageCount: 3, nearbyCount: 3 })).toEqual([1, 2, 3]);
    expect(getPageSequence({ pageNumber: 3, pageCount: 5, nearbyCount: 7 })).toEqual([1, 2, 3, 4, 5]);
  });

  test("gaps only the right side near the start", () => {
    expect(getPageSequence({ pageNumber: 1, pageCount: 10, nearbyCount: 3 })).toEqual([1, 2, 3, "gap", 10]);
  });

  test("gaps only the left side near the end", () => {
    expect(getPageSequence({ pageNumber: 10, pageCount: 10, nearbyCount: 3 })).toEqual([1, "gap", 8, 9, 10]);
  });

  test("gaps both sides in the middle", () => {
    expect(getPageSequence({ pageNumber: 10, pageCount: 20, nearbyCount: 5 })).toEqual([1, "gap", 8, 9, 10, 11, 12, "gap", 20]);
  });

  test("shows a single hidden page instead of a gap", () => {
    expect(getPageSequence({ pageNumber: 3, pageCount: 5, nearbyCount: 3 })).toEqual([1, 2, 3, 4, 5]);
  });

  test.each(NEARBY_COUNTS)("always lists the current page with %i nearby", nearbyCount => {
    for (let pageCount = 1; pageCount <= 30; pageCount += 1) {
      for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
        expect(getPageSequence({ pageNumber, pageCount, nearbyCount })).toContain(pageNumber);
      }
    }
  });

  test.each(NEARBY_COUNTS)("lists page numbers once each, in increasing order, with %i nearby", nearbyCount => {
    for (const sequence of listSequences(nearbyCount)) {
      const pages = listPageNumbers(sequence);

      expect(pages).toEqual([...new Set(pages)].sort((a, b) => a - b));
    }
  });

  test.each(NEARBY_COUNTS)("puts a gap only where two or more pages are hidden with %i nearby", nearbyCount => {
    for (const sequence of listSequences(nearbyCount)) {
      sequence.forEach((term, index) => {
        if (term === "gap") {
          expect((sequence[index + 1] as number) - (sequence[index - 1] as number)).toBeGreaterThan(2);
        }
      });
    }
  });
});
