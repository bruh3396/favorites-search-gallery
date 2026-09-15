import { afterEach, describe, expect, test } from "vitest";
import { resetEnvironment, setEnvironment } from "@/app/context/environment";
import { GalleryConfig } from "@/config/gallery_config";
import { GalleryImageBudgeter } from "@/features/gallery/view/rendering/image/budgeter";

function thumbs(count: number): HTMLElement[] {
  return Array.from({ length: count }, (_, i) => ({ id: `thumb-${i}` }) as HTMLElement);
}

describe("GalleryImageBudgeter", () => {
  afterEach(() => resetEnvironment());

  test("partitions by count off the favorites page", () => {
    setEnvironment({ ON_FAVORITES_PAGE: false, ON_MOBILE_DEVICE: false });
    const budgeter = new GalleryImageBudgeter(() => 0);
    const { accepted, rejected } = budgeter.partition(thumbs(GalleryConfig.cachedImageCount + 3));

    expect(accepted).toHaveLength(GalleryConfig.cachedImageCount);
    expect(rejected).toHaveLength(3);
  });

  test("partitions by memory on desktop favorites, stopping past the megabyte limit", () => {
    setEnvironment({ ON_FAVORITES_PAGE: true, ON_MOBILE_DEVICE: false });
    const hugePixelCount = GalleryConfig.imageMegabyteLimit * 220_000;
    const budgeter = new GalleryImageBudgeter(() => hugePixelCount);
    const { accepted } = budgeter.partition(thumbs(50));

    expect(accepted.length).toBeGreaterThanOrEqual(GalleryConfig.minimumCachedImageCount);
    expect(accepted.length).toBeLessThan(50);
  });
});
