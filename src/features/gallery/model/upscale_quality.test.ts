import { beforeEach, describe, expect, test } from "vitest";
import { GalleryDynamicUpscaleQuality } from "@/features/gallery/model/upscale_quality";
import { QualityCutoff, UpscaleQuality } from "@/types/app";

const cutoffs: QualityCutoff[] = [
  { maxRatio: 0.10, quality: UpscaleQuality.Low },
  { maxRatio: 0.20, quality: UpscaleQuality.Normal },
  { maxRatio: 0.35, quality: UpscaleQuality.High },
  { maxRatio: Infinity, quality: UpscaleQuality.Ultra }
];

describe("GalleryDynamicUpscaleQuality", () => {
  let thumbWidth: number | null;
  let viewportWidth: number;

  function create(): GalleryDynamicUpscaleQuality {
    return new GalleryDynamicUpscaleQuality(() => thumbWidth, () => viewportWidth, cutoffs);
  }

  beforeEach(() => {
    thumbWidth = null;
    viewportWidth = 1000;
  });

  test.each([
    [50, UpscaleQuality.Low],
    [99, UpscaleQuality.Low],
    [100, UpscaleQuality.Normal],
    [199, UpscaleQuality.Normal],
    [200, UpscaleQuality.High],
    [349, UpscaleQuality.High],
    [350, UpscaleQuality.Ultra],
    [900, UpscaleQuality.Ultra]
  ])("maps a %ipx thumb in a 1000px viewport to quality %f", (width, expected) => {
    thumbWidth = width;
    expect(create().compute()).toBe(expected);
  });

  test("uses the ratio, not the absolute width", () => {
    thumbWidth = 300;
    viewportWidth = 3000;
    expect(create().compute()).toBe(UpscaleQuality.Normal);
  });

  test("returns null when no thumb is present", () => {
    thumbWidth = null;
    expect(create().compute()).toBeNull();
  });

  test("returns null for a non-positive thumb width", () => {
    thumbWidth = 0;
    expect(create().compute()).toBeNull();
  });

  test("returns null when the viewport width is zero", () => {
    thumbWidth = 100;
    viewportWidth = 0;
    expect(create().compute()).toBeNull();
  });
});
