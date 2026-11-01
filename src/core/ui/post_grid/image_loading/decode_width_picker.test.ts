import { describe, expect, test } from "vitest";
import { pickDecodeWidth } from "@/core/ui/post_grid/image_loading/decode_width_picker";

const LARGE = { width: 4_000, height: 4_000 };
const WIDE = { width: 4_000, height: 2_000 };

describe("pickDecodeWidth", () => {
  test.each([
    { layout: "column", gridWidth: 2_000, size: LARGE, expected: 500 },
    { layout: "grid", gridWidth: 2_000, size: LARGE, expected: 500 },
    { layout: "square", gridWidth: 2_000, size: LARGE, expected: 500 },
    { layout: "square", gridWidth: 2_000, size: WIDE, expected: 1_000 },
    { layout: "row", gridWidth: 2_000, size: WIDE, expected: 1_000 }
  ] as const)("returns the width a $layout tile shows in a $gridWidth px grid", ({ layout, gridWidth, size, expected }) => {
    expect(pickDecodeWidth({ layout, columnCount: 4, gridWidth }, size)).toBe(expected);
  });

  test("rounds up to the next 250 px step", () => {
    expect(pickDecodeWidth({ layout: "column", columnCount: 4, gridWidth: 2_004 }, LARGE)).toBe(750);
  });

  test("returns zero for a tile no wider than 100 px", () => {
    expect(pickDecodeWidth({ layout: "column", columnCount: 4, gridWidth: 400 }, LARGE)).toBe(0);
  });

  test("decodes a tile just wider than 100 px", () => {
    expect(pickDecodeWidth({ layout: "column", columnCount: 4, gridWidth: 404 }, LARGE)).toBe(250);
  });

  test("caps at the original's width", () => {
    expect(pickDecodeWidth({ layout: "column", columnCount: 1, gridWidth: 1_000 }, { width: 600, height: 900 })).toBe(600);
  });

  test("caps at 2000 px", () => {
    expect(pickDecodeWidth({ layout: "column", columnCount: 1, gridWidth: 3_840 }, { width: 8_000, height: 8_000 })).toBe(2_000);
  });

  test("treats an unknown size as a square with no cap but the maximum", () => {
    expect(pickDecodeWidth({ layout: "row", columnCount: 2, gridWidth: 1_000 }, { width: 0, height: 0 })).toBe(500);
  });

  test("returns zero for the native layout or an unmeasured grid", () => {
    expect(pickDecodeWidth({ layout: "native", columnCount: 4, gridWidth: 1_000 }, LARGE)).toBe(0);
    expect(pickDecodeWidth({ layout: "column", columnCount: 4, gridWidth: 0 }, LARGE)).toBe(0);
  });
});
