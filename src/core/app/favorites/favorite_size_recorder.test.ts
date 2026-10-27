import { describe, expect, test, vi } from "vitest";
import { Favorite } from "@/core/features/favorites/favorite";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { Signal } from "@/core/utils/reactive/signal";
import { FavoriteSizeRecorder } from "@/core/app/favorites/favorite_size_recorder";

function createFavorite(width: number, height: number): Favorite {
  return {
    id: `${width}x${height}`,
    numericId: (width * 100) + height,
    media: { kind: "image", locator: "" },
    isNew: false,
    ratingBit: 0,
    tags: new Set(),
    getMetric: metric => (metric === "width" ? width : height)
  };
}

function setup(
  storage = new MemoryLocalKeyedValues(), ownerId = "1",
  { results = new Signal<readonly Favorite[]>([]), scheduler = new MemoryScheduler() } = {}
): FavoriteSizeRecorder {
  return new FavoriteSizeRecorder({ ownerId, measuredCount: 3, recordDelay: 100, fallbackCount: 2 }, { storage, results, scheduler });
}

describe("FavoriteSizeRecorder", () => {
  test("records results after they settle and cancels an empty result", () => {
    const storage = new MemoryLocalKeyedValues();
    const scheduler = new MemoryScheduler();
    const results = new Signal<readonly Favorite[]>([]);

    setup(storage, "1", { results, scheduler });

    results.value = [createFavorite(4, 3)];
    scheduler.advance(50);
    results.value = [];
    scheduler.advance(100);

    expect(storage.get("favoriteSizes")).toBeUndefined();

    results.value = [createFavorite(1, 2)];
    scheduler.advance(99);
    expect(storage.get("favoriteSizes")).toBeUndefined();
    scheduler.advance(1);
    expect(storage.get("favoriteSizes")).toEqual({ 1: [{ width: 1, height: 2 }] });
  });

  describe("value", () => {
    test("returns the fallback squares when the owner has none recorded", () => {
      expect(setup().sizes).toEqual([{ width: 1, height: 1 }, { width: 1, height: 1 }]);
    });

    test("returns the fallback squares when the record isn't a list of dimensions", () => {
      const storage = new MemoryLocalKeyedValues();

      storage.set("favoriteSizes", { 1: [{ width: "4", height: 3 }] });
      expect(setup(storage).sizes).toEqual([{ width: 1, height: 1 }, { width: 1, height: 1 }]);
    });
  });

  describe("record", () => {
    test("measures every favorite, including those whose dimensions aren't known", () => {
      const favoriteSizeRecorder = setup();

      favoriteSizeRecorder.record([createFavorite(4, 3), createFavorite(0, 0), createFavorite(1, 2)]);
      expect(favoriteSizeRecorder.sizes).toEqual([{ width: 4, height: 3 }, { width: 0, height: 0 }, { width: 1, height: 2 }]);
    });

    test("measures only the configured number of favorites", () => {
      const favoriteSizeRecorder = setup();

      favoriteSizeRecorder.record(Array.from({ length: 5 }, () => createFavorite(1, 1)));
      expect(favoriteSizeRecorder.sizes).toHaveLength(3);
    });

    test("doesn't write unchanged dimensions again", () => {
      const storage = new MemoryLocalKeyedValues();
      const favoriteSizeRecorder = setup(storage);
      const write = vi.spyOn(storage, "set");

      favoriteSizeRecorder.record([createFavorite(4, 3)]);
      favoriteSizeRecorder.record([createFavorite(4, 3)]);
      expect(write).toHaveBeenCalledOnce();
    });

    test("keeps each owner's dimensions apart", () => {
      const storage = new MemoryLocalKeyedValues();

      setup(storage, "1").record([createFavorite(4, 3)]);
      setup(storage, "2").record([createFavorite(1, 2)]);
      expect(storage.get("favoriteSizes")).toEqual({ 1: [{ width: 4, height: 3 }], 2: [{ width: 1, height: 2 }] });
    });
  });
});
