import { DECODE_WIDTH_STEP, MAX_DECODE_WIDTH, MIN_DECODE_WIDTH, computeDecodeWidth } from "@/core/ui/post_grid/decode_width";
import { describe, expect, test } from "vitest";

const LARGE = { width: 4_000, height: 4_000 };
const WIDE = { width: 4_000, height: 2_000 };

describe("computeDecodeWidth", () => {
  test.each([
    ["column", 2_000, LARGE, 500],
    ["grid", 2_000, LARGE, 500],
    ["square", 2_000, LARGE, 500],
    ["square", 2_000, WIDE, 1_000],
    ["row", 2_000, WIDE, 1_000]
  ] as const)("returns the width a %s tile shows in a %i px grid", (layout, gridWidth, dimensions, expected) => {
    expect(computeDecodeWidth({ layout, tilesPerRow: 4, gridWidth }, dimensions)).toBe(expected);
  });

  test("rounds up to the next step", () => {
    expect(computeDecodeWidth({ layout: "column", tilesPerRow: 4, gridWidth: 2_004 }, LARGE)).toBe(DECODE_WIDTH_STEP * 3);
  });

  test("divides columns by the rounded column count and rows by the exact tiles per row", () => {
    expect(computeDecodeWidth({ layout: "column", tilesPerRow: 3.6, gridWidth: 2_000 }, LARGE)).toBe(500);
    expect(computeDecodeWidth({ layout: "row", tilesPerRow: 3.6, gridWidth: 1_800 }, LARGE)).toBe(500);
  });

  test("returns zero for a tile no wider than the minimum", () => {
    expect(computeDecodeWidth({ layout: "column", tilesPerRow: 4, gridWidth: 4 * MIN_DECODE_WIDTH }, LARGE)).toBe(0);
  });

  test("decodes a tile just wider than the minimum", () => {
    expect(computeDecodeWidth({ layout: "column", tilesPerRow: 4, gridWidth: 4 * MIN_DECODE_WIDTH + 4 }, LARGE)).toBe(DECODE_WIDTH_STEP);
  });

  test("caps at the original's width", () => {
    expect(computeDecodeWidth({ layout: "column", tilesPerRow: 1, gridWidth: 1_000 }, { width: 600, height: 900 })).toBe(600);
  });

  test("caps at the maximum width", () => {
    expect(computeDecodeWidth({ layout: "column", tilesPerRow: 1, gridWidth: 3_840 }, { width: 8_000, height: 8_000 })).toBe(MAX_DECODE_WIDTH);
  });

  test("treats unknown dimensions as a square with no cap but the maximum", () => {
    expect(computeDecodeWidth({ layout: "row", tilesPerRow: 2, gridWidth: 1_000 }, { width: 0, height: 0 })).toBe(500);
  });

  test("returns zero for the native layout or an unmeasured grid", () => {
    expect(computeDecodeWidth({ layout: "native", tilesPerRow: 4, gridWidth: 1_000 }, LARGE)).toBe(0);
    expect(computeDecodeWidth({ layout: "column", tilesPerRow: 4, gridWidth: 0 }, LARGE)).toBe(0);
  });
});
