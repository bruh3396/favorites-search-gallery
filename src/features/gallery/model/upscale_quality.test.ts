import { QualityCutoff, UpscaleQuality } from "@/types/app";
import { describe, expect, test } from "vitest";
import { qualityFor } from "@/features/gallery/model/upscale_quality";

const cutoffs: QualityCutoff[] = [
  { maxRatio: 0.10, quality: UpscaleQuality.Low },
  { maxRatio: 0.20, quality: UpscaleQuality.Normal },
  { maxRatio: 0.35, quality: UpscaleQuality.High },
  { maxRatio: Infinity, quality: UpscaleQuality.Ultra }
];

describe("qualityFor", () => {
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
    expect(qualityFor(width, 1_000, cutoffs)).toBe(expected);
  });

  test("uses the ratio, not the absolute width", () => {
    expect(qualityFor(300, 3_000, cutoffs)).toBe(UpscaleQuality.Normal);
  });

  test("returns null for a non-positive thumb width", () => {
    expect(qualityFor(0, 1_000, cutoffs)).toBeNull();
  });

  test("returns null when the viewport width is zero", () => {
    expect(qualityFor(100, 0, cutoffs)).toBeNull();
  });

  test("falls back to full quality when the ratio exceeds every cutoff", () => {
    expect(qualityFor(500, 1_000, [{ maxRatio: 0.10, quality: UpscaleQuality.Low }])).toBe(1);
  });
});
