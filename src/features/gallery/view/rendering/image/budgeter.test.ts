import { describe, expect, test } from "vitest";
import { Environment } from "@/app/context/environment";
import { GalleryConfig } from "@/config/gallery_config";
import { GalleryImageBudgeter } from "@/features/gallery/view/rendering/image/budgeter";

interface EnvOverrides {
  onFavoritesPage?: boolean;
  onMobileDevice?: boolean;
}

function thumb(id: string): HTMLElement {
  return { id } as unknown as HTMLElement;
}

function thumbs(count: number): HTMLElement[] {
  return Array.from({ length: count }, (_, i) => thumb(String(i)));
}

function fakeEnvironment(overrides: EnvOverrides): Environment {
  return {
    onFavoritesPage: overrides.onFavoritesPage ?? false,
    onMobileDevice: overrides.onMobileDevice ?? false
  } as unknown as Environment;
}

const PIXELS_PER_MB = 220_000;

function budgeterWithUniformSize(env: EnvOverrides, megabytesPerRequest: number): GalleryImageBudgeter {
  return new GalleryImageBudgeter(fakeEnvironment(env), () => megabytesPerRequest * PIXELS_PER_MB);
}

function acceptedIds(budgeter: GalleryImageBudgeter, elements: HTMLElement[]): string[] {
  return budgeter.partition(elements).accepted.map(r => r.id);
}

function rejectedIds(budgeter: GalleryImageBudgeter, elements: HTMLElement[]): string[] {
  return budgeter.partition(elements).rejected.map(r => r.id);
}

describe("GalleryImageBudgeter", () => {
  describe("strategy selection", () => {
    test("budgets by memory on the favorites page on desktop", () => {
      const budgeter = budgeterWithUniformSize({ onFavoritesPage: true, onMobileDevice: false }, 200);
      const elements = thumbs(6);

      expect(acceptedIds(budgeter, elements)).toEqual(["0", "1", "2", "3", "4"]);
      expect(rejectedIds(budgeter, elements)).toEqual(["5"]);
    });

    test("budgets by count on the favorites page on mobile", () => {
      const budgeter = budgeterWithUniformSize({ onFavoritesPage: true, onMobileDevice: true }, 10_000);
      const elements = thumbs(GalleryConfig.cachedImageCount.mobile + 2);

      expect(acceptedIds(budgeter, elements)).toHaveLength(GalleryConfig.cachedImageCount.mobile);
      expect(rejectedIds(budgeter, elements)).toHaveLength(2);
    });

    test("budgets by count off the favorites page on desktop", () => {
      const budgeter = budgeterWithUniformSize({ onFavoritesPage: false, onMobileDevice: false }, 10_000);
      const elements = thumbs(GalleryConfig.cachedImageCount.desktop + 3);

      expect(acceptedIds(budgeter, elements)).toHaveLength(GalleryConfig.cachedImageCount.desktop);
      expect(rejectedIds(budgeter, elements)).toHaveLength(3);
    });

    test("budgets by count off the favorites page on mobile", () => {
      const budgeter = budgeterWithUniformSize({ onFavoritesPage: false, onMobileDevice: true }, 10_000);
      const elements = thumbs(GalleryConfig.cachedImageCount.mobile + 1);

      expect(acceptedIds(budgeter, elements)).toHaveLength(GalleryConfig.cachedImageCount.mobile);
      expect(rejectedIds(budgeter, elements)).toHaveLength(1);
    });
  });

  describe("memory budgeting", () => {
    const memoryEnv: EnvOverrides = { onFavoritesPage: true, onMobileDevice: false };

    test("accepts every request when the total never reaches the limit", () => {
      const budgeter = budgeterWithUniformSize(memoryEnv, 10);
      const elements = thumbs(3);

      expect(acceptedIds(budgeter, elements)).toEqual(["0", "1", "2"]);
      expect(rejectedIds(budgeter, elements)).toEqual([]);
    });

    test("keeps accepting past the memory limit until the minimum count is met", () => {
      const budgeter = budgeterWithUniformSize(memoryEnv, 800);
      const elements = thumbs(7);

      expect(acceptedIds(budgeter, elements)).toHaveLength(GalleryConfig.minimumCachedImageCount);
      expect(rejectedIds(budgeter, elements)).toEqual(["5", "6"]);
    });

    test("stops once both the memory limit and the minimum count are satisfied", () => {
      const budgeter = budgeterWithUniformSize(memoryEnv, 200);
      const elements = thumbs(10);

      expect(acceptedIds(budgeter, elements)).toEqual(["0", "1", "2", "3", "4"]);
      expect(rejectedIds(budgeter, elements)).toEqual(["5", "6", "7", "8", "9"]);
    });
  });

  test("partitions an empty list into two empty lists", () => {
    const budgeter = budgeterWithUniformSize({ onFavoritesPage: true, onMobileDevice: false }, 200);

    const { accepted, rejected } = budgeter.partition([]);

    expect(accepted).toEqual([]);
    expect(rejected).toEqual([]);
  });
});
