import { describe, expect, test } from "vitest";
import { paginationUpdateStrategy } from "@/lib/ui/pagination";

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
