import { clampedThumbsAroundId, wrappingThumbsAroundId } from "@/features/gallery/model/item_window";
import { describe, expect, test } from "vitest";
import { Identifiable } from "@/types/app";

const createItems = (...ids: string[]): Identifiable[] => ids.map(id => ({ id }));
const identity = (item: Identifiable): Identifiable => item;
const idsOf = (items2: Identifiable[]): string[] => items2.map(item => item.id);

describe("clampedThumbsAroundId", () => {
  test("returns the item then its neighbors outward", () => {
    expect(idsOf(clampedThumbsAroundId(createItems("a", "b", "c", "d", "e"), "c", identity))).toEqual(["c", "b", "d", "a", "e"]);
  });

  test("returns nothing for an id that is not present", () => {
    expect(clampedThumbsAroundId(createItems("a", "b", "c"), "missing", identity)).toEqual([]);
  });

  test("returns nothing when there are no candidates", () => {
    expect(clampedThumbsAroundId([], "a", identity)).toEqual([]);
  });

  test("stops at the last item", () => {
    expect(idsOf(clampedThumbsAroundId(createItems("a", "b", "c", "d", "e"), "e", identity))).toEqual(["e", "d", "c", "b", "a"]);
  });

  test("stops at the first item", () => {
    expect(idsOf(clampedThumbsAroundId(createItems("a", "b", "c", "d", "e"), "a", identity))).toEqual(["a", "b", "c", "d", "e"]);
  });

  test("projects each windowed item to its thumb", () => {
    expect(clampedThumbsAroundId(createItems("a", "b", "c"), "b", item => item.id)).toEqual(["b", "a", "c"]);
  });
});

describe("wrappingThumbsAroundId", () => {
  test("wraps past the last item", () => {
    expect(idsOf(wrappingThumbsAroundId(createItems("a", "b", "c", "d", "e"), "e", identity))).toEqual(["e", "d", "a", "c", "b"]);
  });

  test("wraps past the first item", () => {
    expect(idsOf(wrappingThumbsAroundId(createItems("a", "b", "c", "d", "e"), "a", identity))).toEqual(["a", "e", "b", "d", "c"]);
  });

  test("never repeats an item when wrapping", () => {
    expect(idsOf(wrappingThumbsAroundId(createItems("a", "b", "c"), "a", identity))).toEqual(["a", "c", "b"]);
  });

  test("returns nothing for an id that is not present", () => {
    expect(wrappingThumbsAroundId(createItems("a", "b", "c"), "missing", identity)).toEqual([]);
  });
});
