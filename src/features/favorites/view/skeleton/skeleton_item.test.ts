import { afterEach, describe, expect, test, vi } from "vitest";
import { FavoritesSkeletonItem } from "@/features/favorites/view/skeleton/skeleton_item";
import { Layout } from "@/types/app";
import { SeededSequence } from "@/lib/collection/seeded_sequence";
import { SkeletonConfig } from "@/config/skeleton_config";

const DEFAULT_RANDOM_ANIMATION_TIMING = SkeletonConfig.randomAnimationTiming;

function createItem(layout: Layout, aspectRatio?: string): HTMLElement {
  return new FavoritesSkeletonItem(layout, aspectRatio, new SeededSequence()).element;
}

function sizeOf(element: HTMLElement): { width: number; height: number } {
  return { width: parseFloat(element.style.width), height: parseFloat(element.style.height) };
}

function aspectRatioOf(element: HTMLElement): number[] {
  return element.style.getPropertyValue("aspect-ratio").split("/").map(Number);
}

describe("FavoritesSkeletonItem", () => {
  afterEach(() => {
    SkeletonConfig.randomAnimationTiming = DEFAULT_RANDOM_ANIMATION_TIMING;
    vi.restoreAllMocks();
  });

  test("is a pulsing tile for its layout", () => {
    const element = createItem("grid", "3/4");

    expect(element.dataset.layout).toBe("grid");
    expect(element.dataset.animation).toBe("pulse");
  });

  describe("native layout", () => {
    test("is sized to a known aspect ratio", () => {
      expect(sizeOf(createItem("native", "120/240"))).toEqual({ width: 120, height: 240 });
    });

    test.each<[number, "width" | "height", "width" | "height"]>([
      [0.2, "width", "height"],
      [0.8, "height", "width"]
    ])("without one, maxes out one side and picks the other (random %f)", (random, maxed, picked) => {
      vi.spyOn(Math, "random").mockReturnValue(random);
      const size = sizeOf(createItem("native"));

      expect(size[maxed]).toBe(SkeletonConfig.discreteDimensionMax);
      expect(size[picked]).toBeGreaterThanOrEqual(SkeletonConfig.discreteDimensionMin);
      expect(size[picked]).toBeLessThanOrEqual(SkeletonConfig.discreteDimensionMax);
    });
  });

  describe("other layouts", () => {
    test("take a known aspect ratio", () => {
      expect(aspectRatioOf(createItem("row", "3/4"))).toEqual([3, 4]);
    });

    test("without one, take a fallback aspect ratio", () => {
      const [width, height] = aspectRatioOf(createItem("column"));

      expect(width).toBe(SkeletonConfig.fallbackAspectRatioWidth);
      expect(height).toBeGreaterThanOrEqual(SkeletonConfig.fallbackAspectRatioHeightMin);
      expect(height).toBeLessThanOrEqual(SkeletonConfig.fallbackAspectRatioHeightMax);
    });
  });

  describe("animation timing", () => {
    test("is randomized when enabled", () => {
      SkeletonConfig.randomAnimationTiming = true;
      const element = createItem("grid", "3/4");
      const delay = parseFloat(element.style.getPropertyValue("--delay-skeleton"));
      const duration = parseFloat(element.style.getPropertyValue("--duration-skeleton"));

      expect(delay).toBeGreaterThanOrEqual(SkeletonConfig.animationDelayRange.min);
      expect(delay).toBeLessThanOrEqual(SkeletonConfig.animationDelayRange.max);
      expect(duration).toBeGreaterThanOrEqual(SkeletonConfig.animationDurationRange.min);
      expect(duration).toBeLessThanOrEqual(SkeletonConfig.animationDurationRange.max);
    });

    test("is left to the stylesheet when disabled", () => {
      SkeletonConfig.randomAnimationTiming = false;
      const element = createItem("grid", "3/4");

      expect(element.style.getPropertyValue("--delay-skeleton")).toBe("");
      expect(element.style.getPropertyValue("--duration-skeleton")).toBe("");
    });
  });
});
