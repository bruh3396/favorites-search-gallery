import * as Pager from "@/core/features/favorites/flows/paging/pager";
import { describe, expect, test } from "vitest";

function createItems(count: number): number[] {
  return Array.from({ length: count }, (_, index) => index);
}

describe("countPages", () => {
  test.each([
    [0, 1],
    [1, 1],
    [10, 1],
    [11, 2],
    [30, 3]
  ])("counts %i items as %i pages", (itemCount, expected) => {
    expect(Pager.countPages(itemCount, 10)).toBe(expected);
  });
});

describe("clampPage", () => {
  test.each([
    [-1, 1],
    [0, 1],
    [2, 2],
    [3, 3],
    [4, 3]
  ])("clamps page %i to %i", (pageNumber, expected) => {
    expect(Pager.clampPage(pageNumber, 3)).toBe(expected);
  });
});

describe("createNumberedPager", () => {
  const pager = Pager.createNumberedPager(10);

  describe("slice", () => {
    test("returns the items on the page", () => {
      expect(pager.slice(createItems(25), 2)).toEqual([10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
    });

    test("returns the remaining items on the final page", () => {
      expect(pager.slice(createItems(25), 3)).toEqual([20, 21, 22, 23, 24]);
    });

    test("returns no items past the final page", () => {
      expect(pager.slice(createItems(25), 4)).toEqual([]);
    });
  });

  describe("step", () => {
    test("steps to the adjacent page", () => {
      expect(pager.step(2, "forward", { pageCount: 3, canWrap: false })).toBe(3);
      expect(pager.step(2, "backward", { pageCount: 3, canWrap: false })).toBe(1);
    });

    test("wraps past either end when allowed", () => {
      expect(pager.step(3, "forward", { pageCount: 3, canWrap: true })).toBe(1);
      expect(pager.step(1, "backward", { pageCount: 3, canWrap: true })).toBe(3);
    });

    test("wraps onto the same page when there is only one", () => {
      expect(pager.step(1, "forward", { pageCount: 1, canWrap: true })).toBe(1);
    });

    test("stops at either end when not allowed to wrap", () => {
      expect(pager.step(3, "forward", { pageCount: 3, canWrap: false })).toBeUndefined();
      expect(pager.step(1, "backward", { pageCount: 3, canWrap: false })).toBeUndefined();
    });
  });
});

describe("SCROLLING_PAGER", () => {
  describe("slice", () => {
    test("returns every revealed batch of 25", () => {
      expect(Pager.SCROLLING_PAGER.slice(createItems(60), 2)).toHaveLength(50);
    });
  });

  describe("step", () => {
    test("reveals the next batch until none are left", () => {
      expect(Pager.SCROLLING_PAGER.step(1, "forward", { pageCount: 3, canWrap: true })).toBe(2);
      expect(Pager.SCROLLING_PAGER.step(3, "forward", { pageCount: 3, canWrap: true })).toBeUndefined();
    });

    test("never moves backward", () => {
      expect(Pager.SCROLLING_PAGER.step(2, "backward", { pageCount: 3, canWrap: true })).toBeUndefined();
    });
  });
});
