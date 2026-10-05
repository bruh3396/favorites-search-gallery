import { describe, expect, test } from "vitest";
import { Favorite } from "@/types/favorite";
import { FavoritesThumbSizeRecorder } from "@/features/favorites/model/thumb_size_recorder";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";

function createFavorite(width: number, height: number): Favorite {
  return { post: { width, height } } as unknown as Favorite;
}

describe("FavoritesThumbSizeRecorder", () => {
  test("returns nothing on a first visit", () => {
    expect(new FavoritesThumbSizeRecorder({ ownerId: "1" }, new MemoryLocalKeyedValues()).getRecorded()).toEqual([]);
  });

  test("gives the next visit the recorded post sizes in order", () => {
    const localKeyedValues = new MemoryLocalKeyedValues();

    new FavoritesThumbSizeRecorder({ ownerId: "1" }, localKeyedValues).record([createFavorite(100, 200), createFavorite(0, 0), createFavorite(300, 150)]);
    expect(new FavoritesThumbSizeRecorder({ ownerId: "1" }, localKeyedValues).getRecorded()).toEqual([{ width: 100, height: 200 }, { width: 300, height: 150 }]);
  });

  test("records only the first favorites", () => {
    const localKeyedValues = new MemoryLocalKeyedValues();
    const recorder = new FavoritesThumbSizeRecorder({ ownerId: "1" }, localKeyedValues);

    recorder.record(Array.from({ length: 60 }, (_, index) => createFavorite(index + 1, 1)));
    expect(recorder.getRecorded().at(-1)).toEqual({ width: 50, height: 1 });
  });

  test("returns nothing for another owner's favorites", () => {
    const localKeyedValues = new MemoryLocalKeyedValues();

    new FavoritesThumbSizeRecorder({ ownerId: "1" }, localKeyedValues).record([createFavorite(100, 200)]);
    expect(new FavoritesThumbSizeRecorder({ ownerId: "2" }, localKeyedValues).getRecorded()).toEqual([]);
  });

  test("skips stored entries that aren't sizes", () => {
    const localKeyedValues = new MemoryLocalKeyedValues();

    localKeyedValues.set("skeletonThumbSizes", { ownerId: "1", sizes: [{ width: 1, height: 2 }, "3/4", { width: 5 }, null] });
    expect(new FavoritesThumbSizeRecorder({ ownerId: "1" }, localKeyedValues).getRecorded()).toEqual([{ width: 1, height: 2 }]);
  });
});
