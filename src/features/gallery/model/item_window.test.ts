import { describe, expect, test, vi } from "vitest";
import { Identifiable } from "@/types/app";
import { GalleryItemWindow } from "@/features/gallery/model/item_window";

const items = (...ids: string[]): Identifiable[] => ids.map(id => ({ id }));

const windowOf = (getItems: () => Identifiable[], wrapAround: boolean = false, limit?: number): GalleryItemWindow<Identifiable> => new GalleryItemWindow(getItems, wrapAround, limit);

const idsAround = (
  candidates: Identifiable[],
  wrapAround: boolean,
  id: string,
  limit?: number
): string[] => windowOf(() => candidates, wrapAround, limit).getItemsAround(id).map(item => item.id);

describe("ItemWindow", () => {
  test("returns the item itself first", () => {
    expect(idsAround(items("a", "b", "c"), false, "b", 1)).toEqual(["b"]);
  });

  test("returns the item then its left and right neighbors", () => {
    expect(idsAround(items("a", "b", "c", "d", "e"), false, "c", 3)).toEqual(["c", "b", "d"]);
  });

  test("returns nothing for an id that is not a candidate", () => {
    expect(idsAround(items("a", "b", "c"), false, "missing")).toEqual([]);
  });

  test("returns nothing when there are no candidates", () => {
    expect(idsAround([], false, "a")).toEqual([]);
  });

  test("returns nothing when the limit is zero", () => {
    expect(idsAround(items("a", "b", "c"), false, "b", 0)).toEqual([]);
  });

  test("returns every candidate when the limit exceeds the count", () => {
    expect(idsAround(items("a", "b", "c"), false, "a", 10)).toEqual(["a", "b", "c"]);
  });
});

describe("ItemWindow wrapAround", () => {
  test("wraps past the last item when enabled", () => {
    expect(idsAround(items("a", "b", "c", "d", "e"), true, "e", 3)).toEqual(["e", "d", "a"]);
  });

  test("wraps past the first item when enabled", () => {
    expect(idsAround(items("a", "b", "c", "d", "e"), true, "a", 3)).toEqual(["a", "e", "b"]);
  });

  test("stops at the last item when disabled", () => {
    expect(idsAround(items("a", "b", "c", "d", "e"), false, "e", 3)).toEqual(["e", "d", "c"]);
  });

  test("stops at the first item when disabled", () => {
    expect(idsAround(items("a", "b", "c", "d", "e"), false, "a", 3)).toEqual(["a", "b", "c"]);
  });

  test("never repeats an item when wrapping", () => {
    expect(idsAround(items("a", "b", "c"), true, "a", 10)).toEqual(["a", "c", "b"]);
  });
});

describe("ItemWindow candidates", () => {
  test("reads the candidates on every call", () => {
    const getItems = vi.fn(() => items("a", "b", "c"));
    const finder = windowOf(getItems);

    finder.getItemsAround("a");
    finder.getItemsAround("a");

    expect(getItems).toHaveBeenCalledTimes(2);
  });

  test("sees candidates that changed after construction", () => {
    let candidates = items("a", "b");
    const finder = windowOf(() => candidates, false, 3);

    candidates = items("x", "y", "z");

    expect(finder.getItemsAround("y").map(item => item.id)).toEqual(["y", "x", "z"]);
  });

  test("returns nothing once the candidates are emptied", () => {
    let candidates = items("a", "b");
    const finder = windowOf(() => candidates);

    candidates = [];

    expect(finder.getItemsAround("a")).toEqual([]);
  });

  test("returns the candidate objects themselves", () => {
    const candidates = items("a", "b");
    const finder = windowOf(() => candidates, false, 1);

    expect(finder.getItemsAround("a")[0]).toBe(candidates[0]);
  });
});

describe("ItemWindow limit", () => {
  test("falls back to fifty items when no limit is configured", () => {
    const candidates = items(...Array.from({ length: 100 }, (_, i) => `id${i}`));

    expect(idsAround(candidates, false, "id50")).toHaveLength(50);
  });

  test("uses the configured limit", () => {
    const finder = windowOf(() => items("a", "b", "c", "d", "e"), false, 3);

    expect(finder.getItemsAround("c").map(item => item.id)).toEqual(["c", "b", "d"]);
  });

  test("keeps the configured limit across calls", () => {
    const finder = windowOf(() => items("a", "b", "c", "d", "e"), false, 1);

    expect(finder.getItemsAround("c").map(item => item.id)).toEqual(["c"]);
    expect(finder.getItemsAround("a").map(item => item.id)).toEqual(["a"]);
  });
});
