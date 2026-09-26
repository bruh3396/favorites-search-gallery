import { describe, expect, test } from "vitest";
import { Identifiable } from "@/types/app";
import { Paginator } from "@/lib/ui/paginator";

const createItems = (count: number): Identifiable[] => Array.from({ length: count }, (_, i) => ({ id: String(i + 1) }));
const idsOf = (results: Identifiable[]): string[] => results.map(r => r.id);

const createPaginator = (count: number, perPage = 10, nearby = 2): Paginator<Identifiable> => {
  const paginator = new Paginator<Identifiable>({ resultsPerPage: (): number => perPage, nearbyPageCount: nearby });

  paginator.paginate(createItems(count));
  return paginator;
};

describe("Paginator", () => {
  describe("paginate", () => {
    test("returns the items it was given", () => {
      const paginator = new Paginator<Identifiable>({ resultsPerPage: (): number => 10, nearbyPageCount: 2 });
      const next = createItems(3);

      expect(paginator.paginate(next)).toBe(next);
    });
  });

  describe("currentPageItems", () => {
    test("returns the first page's slice by default", () => {
      const paginator = createPaginator(25, 10);

      expect(idsOf(paginator.currentPageItems())).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]);
    });

    test("returns the slice for the selected page", () => {
      const paginator = createPaginator(25, 10);

      paginator.selectPage(3);
      expect(idsOf(paginator.currentPageItems())).toEqual(["21", "22", "23", "24", "25"]);
    });

    test("returns an empty page when there are no items", () => {
      const paginator = createPaginator(0, 10);

      expect(paginator.currentPageItems()).toEqual([]);
    });
  });

  describe("adjacentPageItems", () => {
    test("returns items from the previous and next pages", () => {
      const paginator = createPaginator(30, 10);

      paginator.selectPage(2);
      expect(idsOf(paginator.adjacentPageItems())).toEqual([
        "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
        "21", "22", "23", "24", "25", "26", "27", "28", "29", "30"
      ]);
    });

    test("omits missing neighbors at the edges", () => {
      const paginator = createPaginator(25, 10);

      expect(idsOf(paginator.adjacentPageItems())).toEqual(["11", "12", "13", "14", "15", "16", "17", "18", "19", "20"]);
    });
  });

  describe("selectPage", () => {
    test("reports a change when the page moves", () => {
      const paginator = createPaginator(25, 10);

      expect(paginator.selectPage(2)).toBe(true);
    });

    test("reports no change when the page stays the same", () => {
      const paginator = createPaginator(25, 10);

      expect(paginator.selectPage(1)).toBe(false);
    });

    test("clamps below the first page", () => {
      const paginator = createPaginator(25, 10);

      paginator.selectPage(2);
      paginator.selectPage(-5);
      expect(idsOf(paginator.currentPageItems())).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]);
    });

    test("clamps beyond the final page", () => {
      const paginator = createPaginator(25, 10);

      paginator.selectPage(99);
      expect(idsOf(paginator.currentPageItems())).toEqual(["21", "22", "23", "24", "25"]);
    });
  });

  describe("selectAdjacentPage", () => {
    test("moves forward", () => {
      const paginator = createPaginator(30, 10);

      paginator.selectAdjacentPage("ArrowRight");
      expect(idsOf(paginator.currentPageItems())).toEqual(["11", "12", "13", "14", "15", "16", "17", "18", "19", "20"]);
    });

    test("does not move past the final page", () => {
      const paginator = createPaginator(15, 10);

      paginator.selectPage(2);
      expect(paginator.selectAdjacentPage("ArrowRight")).toBe(false);
    });
  });

  describe("selectWrappedAdjacentPage", () => {
    test("wraps from the last page to the first", () => {
      const paginator = createPaginator(25, 10);

      paginator.selectPage(3);
      paginator.selectWrappedAdjacentPage("ArrowRight");
      expect(idsOf(paginator.currentPageItems())).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]);
    });

    test("wraps from the first page to the last", () => {
      const paginator = createPaginator(25, 10);

      paginator.selectWrappedAdjacentPage("ArrowLeft");
      expect(idsOf(paginator.currentPageItems())).toEqual(["21", "22", "23", "24", "25"]);
    });
  });

  describe("selectPageContaining", () => {
    test("selects the page holding the given id", () => {
      const paginator = createPaginator(30, 10);

      expect(paginator.selectPageContaining("25")).toBe(true);
      expect(idsOf(paginator.currentPageItems())).toEqual(["21", "22", "23", "24", "25", "26", "27", "28", "29", "30"]);
    });

    test("returns false for an unknown id", () => {
      const paginator = createPaginator(30, 10);

      expect(paginator.selectPageContaining("999")).toBe(false);
    });

    test("returns false when the id is already on the current page", () => {
      const paginator = createPaginator(30, 10);

      expect(paginator.selectPageContaining("5")).toBe(false);
    });
  });

  describe("atFinalPage / hasOnlyOnePage", () => {
    test("atFinalPage is true on the last page", () => {
      const paginator = createPaginator(25, 10);

      paginator.selectPage(3);
      expect(paginator.atFinalPage()).toBe(true);
    });

    test("atFinalPage is false before the last page", () => {
      const paginator = createPaginator(25, 10);

      expect(paginator.atFinalPage()).toBe(false);
    });

    test("hasOnlyOnePage is true when all items fit on one page", () => {
      expect(createPaginator(5, 10).hasOnlyOnePage()).toBe(true);
    });

    test("hasOnlyOnePage is true for an empty set", () => {
      expect(createPaginator(0, 10).hasOnlyOnePage()).toBe(true);
    });

    test("hasOnlyOnePage is false across multiple pages", () => {
      expect(createPaginator(25, 10).hasOnlyOnePage()).toBe(false);
    });
  });

  describe("paginationState", () => {
    test("reports the current slice bounds and totals", () => {
      const paginator = createPaginator(25, 10, 2);

      paginator.selectPage(2);
      const state = paginator.paginationState();

      expect(state.currentPage).toBe(2);
      expect(state.finalPage).toBe(3);
      expect(state.totalCount).toBe(25);
      expect(state.sliceStart).toBe(10);
      expect(state.sliceEnd).toBe(20);
    });

    test("reports a single page for an empty set", () => {
      const state = createPaginator(0, 10).paginationState();

      expect(state.currentPage).toBe(1);
      expect(state.finalPage).toBe(1);
      expect(state.totalCount).toBe(0);
    });
  });
});
