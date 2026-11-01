import { describe, expect, test, vi } from "vitest";
import { Favorite } from "@/core/features/favorites/favorite";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/memory_local_keyed_values";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/memory_scheduler";
import { Signal } from "@/core/utils/reactive/signal";
import { FavoriteSizeRecorder } from "@/core/app/favorites/search_panel/favorite_size_recorder";
import { KeyedStoredValue } from "@/core/utils/stored_value/keyed_stored_value";
import { Size } from "@/core/utils/geometry/size";

const PLACEHOLDER_SIZES: readonly Size[] = [{ width: 1, height: 1 }, { width: 1, height: 1 }];

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
  localKeyedValues = new MemoryLocalKeyedValues(),
  { results = new Signal<readonly Favorite[]>([]), scheduler = new MemoryScheduler() } = {}
): FavoriteSizeRecorder {
  const sizes = new KeyedStoredValue({ key: "sizes", defaultValue: PLACEHOLDER_SIZES }, { storedValueStorage: localKeyedValues });
  return new FavoriteSizeRecorder({ measuredCount: 3, recordDelay: 100 }, { sizes, results, scheduler });
}

describe("FavoriteSizeRecorder", () => {
  test("records results after they settle and cancels an empty result", () => {
    const localKeyedValues = new MemoryLocalKeyedValues();
    const scheduler = new MemoryScheduler();
    const results = new Signal<readonly Favorite[]>([]);

    setup(localKeyedValues, { results, scheduler });

    results.value = [createFavorite(4, 3)];
    scheduler.advance(50);
    results.value = [];
    scheduler.advance(100);

    expect(localKeyedValues.get("sizes")).toBeUndefined();

    results.value = [createFavorite(1, 2)];
    scheduler.advance(99);
    expect(localKeyedValues.get("sizes")).toBeUndefined();
    scheduler.advance(1);
    expect(localKeyedValues.get("sizes")).toEqual([{ width: 1, height: 2 }]);
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
      const localKeyedValues = new MemoryLocalKeyedValues();
      const favoriteSizeRecorder = setup(localKeyedValues);
      const write = vi.spyOn(localKeyedValues, "set");

      favoriteSizeRecorder.record([createFavorite(4, 3)]);
      favoriteSizeRecorder.record([createFavorite(4, 3)]);
      expect(write).toHaveBeenCalledOnce();
    });
  });
});
