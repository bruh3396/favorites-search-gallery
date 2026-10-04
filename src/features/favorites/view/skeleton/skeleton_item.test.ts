import { afterEach, describe, expect, test } from "vitest";
import { FavoritesSkeletonItem } from "@/features/favorites/view/skeleton/skeleton_item";
import { Layout } from "@/types/app";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/random_source";
import { SeededSequence } from "@/lib/collection/seeded_sequence";
import { SkeletonConfig } from "@/config/skeleton_config";

const DEFAULT_RANDOM_ANIMATION_TIMING = SkeletonConfig.randomAnimationTiming;

function createItem(layout: Layout, aspectRatio?: string, randomSource = new MemoryRandomSource()): HTMLElement {
  return new FavoritesSkeletonItem({ layout, aspectRatio }, { randomSource, fallbackAspectRatioHeights: new SeededSequence() }).element;
}

function readSize(element: HTMLElement): { width: number; height: number } {
  return { width: parseFloat(element.style.width), height: parseFloat(element.style.height) };
}

function readAspectRatio(element: HTMLElement): number[] {
  return element.style.getPropertyValue("aspect-ratio").split("/").map(Number);
}

describe("FavoritesSkeletonItem", () => {
  afterEach(() => {
    SkeletonConfig.randomAnimationTiming = DEFAULT_RANDOM_ANIMATION_TIMING;
  });

  test("is a pulsing tile for its layout", () => {
    const element = createItem("grid", "3/4");

    expect(element.dataset.layout).toBe("grid");
    expect(element.dataset.animation).toBe("pulse");
  });

  test("is sized to a known aspect ratio in the native layout", () => {
    expect(readSize(createItem("native", "120/240"))).toEqual({ width: 120, height: 240 });
  });

  test.each<[number, "width" | "height", "width" | "height"]>([
    [0.2, "width", "height"],
    [0.8, "height", "width"]
  ])("maxes out one side and picks the other in the native layout without a known aspect ratio (random %f)", (randomSource, maxed, picked) => {
    const size = readSize(createItem("native", undefined, new MemoryRandomSource([randomSource])));

    expect(size[maxed]).toBe(SkeletonConfig.discreteDimensionMax);
    expect(size[picked]).toBeGreaterThanOrEqual(SkeletonConfig.discreteDimensionMin);
    expect(size[picked]).toBeLessThanOrEqual(SkeletonConfig.discreteDimensionMax);
  });

  test("takes a known aspect ratio in other layouts", () => {
    expect(readAspectRatio(createItem("row", "3/4"))).toEqual([3, 4]);
  });

  test("takes a fallback aspect ratio in other layouts without a known one", () => {
    const [width, height] = readAspectRatio(createItem("column"));

    expect(width).toBe(SkeletonConfig.fallbackAspectRatioWidth);
    expect(height).toBeGreaterThanOrEqual(SkeletonConfig.fallbackAspectRatioHeightMin);
    expect(height).toBeLessThanOrEqual(SkeletonConfig.fallbackAspectRatioHeightMax);
  });

  test("randomizes its animation timing when enabled", () => {
    SkeletonConfig.randomAnimationTiming = true;
    const element = createItem("grid", "3/4");
    const delay = parseFloat(element.style.getPropertyValue("--delay-skeleton"));
    const duration = parseFloat(element.style.getPropertyValue("--duration-skeleton"));

    expect(delay).toBeGreaterThanOrEqual(SkeletonConfig.animationDelayRangeSeconds.min);
    expect(delay).toBeLessThanOrEqual(SkeletonConfig.animationDelayRangeSeconds.max);
    expect(duration).toBeGreaterThanOrEqual(SkeletonConfig.animationDurationRangeSeconds.min);
    expect(duration).toBeLessThanOrEqual(SkeletonConfig.animationDurationRangeSeconds.max);
  });

  test("leaves its animation timing to the stylesheet when disabled", () => {
    SkeletonConfig.randomAnimationTiming = false;
    const element = createItem("grid", "3/4");

    expect(element.style.getPropertyValue("--delay-skeleton")).toBe("");
    expect(element.style.getPropertyValue("--duration-skeleton")).toBe("");
  });
});
