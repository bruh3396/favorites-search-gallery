import { describe, expect, test } from "vitest";
import { rectDistance, toDimensions2D } from "@/utils/pure/geometry";
import { Dimensions2D } from "@/types/geometry";

describe("toDimensions2D", () => {
  const defaultDimensions: Dimensions2D = { width: 100, height: 100 };

  test("returns the default for an empty string", () => {
    expect(toDimensions2D("")).toStrictEqual(defaultDimensions);
  });

  test("parses a square", () => {
    expect(toDimensions2D("20x20")).toStrictEqual({ width: 20, height: 20 });
  });

  test("parses a rectangle", () => {
    expect(toDimensions2D("1920x1080")).toStrictEqual({ width: 1_920, height: 1_080 });
  });

  test("returns the default for a missing height", () => {
    expect(toDimensions2D("20x")).toStrictEqual(defaultDimensions);
  });

  test("returns the default when letters follow the height", () => {
    expect(toDimensions2D("20x20a")).toStrictEqual(defaultDimensions);
  });

  test("returns the default for letters and spaces", () => {
    expect(toDimensions2D("20x 20a")).toStrictEqual(defaultDimensions);
  });

  test("returns the default for spaces around the separator", () => {
    expect(toDimensions2D("20 x 20")).toStrictEqual(defaultDimensions);
  });

  test("accepts a different separator", () => {
    expect(toDimensions2D("20/20")).toStrictEqual({ width: 20, height: 20 });
  });
});

describe("rectDistance", () => {
  test("returns zero for identical rects", () => {
    const r = createRect({ left: 0, top: 0, width: 10, height: 10 });

    expect(rectDistance(r, r)).toBe(0);
  });

  test("returns zero for rects with the same center regardless of size", () => {
    const a = createRect({ left: 0, top: 0, width: 10, height: 10 });
    const b = createRect({ left: 2.5, top: 2.5, width: 5, height: 5 });

    expect(rectDistance(a, b)).toBe(0);
  });

  test("measures a horizontal separation", () => {
    const a = createRect({ left: 0, top: 0, width: 10, height: 10 });
    const b = createRect({ left: 30, top: 0, width: 10, height: 10 });

    expect(rectDistance(a, b)).toBe(30);
  });

  test("measures a vertical separation", () => {
    const a = createRect({ left: 0, top: 0, width: 10, height: 10 });
    const b = createRect({ left: 0, top: 30, width: 10, height: 10 });

    expect(rectDistance(a, b)).toBe(30);
  });

  test("measures a diagonal separation (3-4-5 triangle)", () => {
    const a = createRect({ left: 0, top: 0, width: 0, height: 0 });
    const b = createRect({ left: 3, top: 4, width: 0, height: 0 });

    expect(rectDistance(a, b)).toBe(5);
  });

  test("returns the same distance in either order", () => {
    const a = createRect({ left: 0, top: 0, width: 10, height: 20 });
    const b = createRect({ left: 100, top: 50, width: 30, height: 40 });

    expect(rectDistance(a, b)).toBe(rectDistance(b, a));
  });

  test("accounts for rect size when computing centers", () => {
    const a = createRect({ left: 0, top: 0, width: 20, height: 0 });
    const b = createRect({ left: 20, top: 0, width: 20, height: 0 });

    expect(rectDistance(a, b)).toBe(20);
  });

  test("handles negative coordinates", () => {
    const a = createRect({ left: -10, top: -10, width: 0, height: 0 });
    const b = createRect({ left: -7, top: -6, width: 0, height: 0 });

    expect(rectDistance(a, b)).toBe(5);
  });
});

function createRect({ left, top, width, height }: Pick<DOMRectReadOnly, "left" | "top" | "width" | "height">): DOMRectReadOnly {
  return { left, top, width, height } as DOMRectReadOnly;
}
