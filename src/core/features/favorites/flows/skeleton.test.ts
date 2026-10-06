import { describe, expect, test } from "vitest";
import { Dimensions } from "@/core/ui/post_grid/tile";
import { Favorite } from "@/core/features/favorites/types/favorite";
import { FavoritesSkeletonFlow } from "@/core/features/favorites/flows/skeleton";
import { Preference } from "@/core/utils/reactive/preference";
import { Signal } from "@/core/utils/reactive/signal";

function createPreference<T>(initial: T): Preference<T> {
  const signal = new Signal(initial);
  return {
    get value(): T {
      return signal.value;
    },
    peek: (): T => signal.peek(),
    set: (value: T): void => {
      signal.value = value;
    }
  };
}

function createFavorite(width: number, height: number): Favorite {
  return {
    id: `${width}x${height}`,
    media: { kind: "image", locator: "" },
    isNew: false,
    tags: new Set(),
    getMetric: metric => (metric === "width" ? width : height)
  };
}

function setup(): { skeleton: FavoritesSkeletonFlow; skeletonDimensions: Preference<readonly Dimensions[]> } {
  const skeletonDimensions = createPreference<readonly Dimensions[]>([{ width: 9, height: 9 }]);
  return { skeleton: new FavoritesSkeletonFlow({ skeletonDimensions }), skeletonDimensions };
}

describe("FavoritesSkeletonFlow", () => {
  test("records the dimensions of the favorites shown, skipping those whose dimensions aren't known", () => {
    const { skeleton, skeletonDimensions } = setup();

    skeleton.record([createFavorite(4, 3), createFavorite(0, 0), createFavorite(1, 2)]);
    expect(skeletonDimensions.value).toEqual([{ width: 4, height: 3 }, { width: 1, height: 2 }]);
  });

  test("keeps publishing the dimensions recorded before it started after recording new ones", () => {
    const { skeleton } = setup();

    skeleton.record([createFavorite(4, 3)]);
    expect(skeleton.recordedDimensions).toEqual([{ width: 9, height: 9 }]);
  });
});
