import { clampedItemsAroundId, wrappingItemsAroundId } from "@/features/gallery/model/item_window";
import { describe, expect, test } from "vitest";

const createItems = (...ids: string[]): { id: string }[] => ids.map(id => ({ id }));
const getIds = (items2: { id: string }[]): string[] => items2.map(item => item.id);

describe("clampedItemsAroundId", () => {
  test("returns the item then its neighbors outward", () => {
    expect(getIds(clampedItemsAroundId(createItems("a", "b", "c", "d", "e"), "c"))).toEqual(["c", "b", "d", "a", "e"]);
  });

  test("returns nothing for an id that is not present", () => {
    expect(clampedItemsAroundId(createItems("a", "b", "c"), "missing")).toEqual([]);
  });

  test("returns nothing when there are no candidates", () => {
    expect(clampedItemsAroundId([], "a")).toEqual([]);
  });

  test("stops at the last item", () => {
    expect(getIds(clampedItemsAroundId(createItems("a", "b", "c", "d", "e"), "e"))).toEqual(["e", "d", "c", "b", "a"]);
  });

  test("stops at the first item", () => {
    expect(getIds(clampedItemsAroundId(createItems("a", "b", "c", "d", "e"), "a"))).toEqual(["a", "b", "c", "d", "e"]);
  });
});

describe("wrappingItemsAroundId", () => {
  test("wraps past the last item", () => {
    expect(getIds(wrappingItemsAroundId(createItems("a", "b", "c", "d", "e"), "e"))).toEqual(["e", "d", "a", "c", "b"]);
  });

  test("wraps past the first item", () => {
    expect(getIds(wrappingItemsAroundId(createItems("a", "b", "c", "d", "e"), "a"))).toEqual(["a", "e", "b", "d", "c"]);
  });

  test("never repeats an item when wrapping", () => {
    expect(getIds(wrappingItemsAroundId(createItems("a", "b", "c"), "a"))).toEqual(["a", "c", "b"]);
  });

  test("returns nothing for an id that is not present", () => {
    expect(wrappingItemsAroundId(createItems("a", "b", "c"), "missing")).toEqual([]);
  });
});
