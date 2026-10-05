import { describe, expect, test } from "vitest";
import { FavoritesSkeleton } from "@/features/favorites/view/skeleton/skeleton";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/random_source";

function readSize(element: HTMLElement): number[] {
  return [Number(element.style.getPropertyValue("--thumb-width")), Number(element.style.getPropertyValue("--thumb-height"))];
}

describe("FavoritesSkeleton", () => {
  describe("createElements", () => {
    test("draws the default number of placeholders when no sizes were recorded", () => {
      expect(new FavoritesSkeleton(new MemoryRandomSource()).createElements("grid", [])).toHaveLength(50);
    });

    test.each([0.2, 0.8])("draws a random thumb-box size (random %f)", randomValue => {
      const [first] = new FavoritesSkeleton(new MemoryRandomSource([randomValue])).createElements("grid", []);
      const [width, height] = readSize(first as HTMLElement);

      expect(Math.max(width, height)).toBe(250);
      expect(Math.min(width, height)).toBeGreaterThanOrEqual(125);
    });

    test("draws one placeholder per recorded size, fitted to the thumb box", () => {
      const elements = new FavoritesSkeleton(new MemoryRandomSource()).createElements("native", [{ width: 1000, height: 2000 }, { width: 300, height: 150 }]);

      expect(elements.map(readSize)).toEqual([[125, 250], [250, 125]]);
    });

    test("draws every placeholder in the layout", () => {
      const layouts = new Set(new FavoritesSkeleton(new MemoryRandomSource()).createElements("row", []).map(element => element.dataset.layout));

      expect(layouts).toEqual(new Set(["row"]));
    });
  });
});
