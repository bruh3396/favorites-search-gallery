import { describe, expect, test } from "vitest";
import { rectDistance, toDimensions2D } from "@/utils/pure/geometry";
import { Dimensions2D } from "@/types/geometry";

describe("parseDimensions2D", () => {
  const defaultDimensions: Dimensions2D = { width: 100, height: 100 };

  test("empty", () => {
    expect(toDimensions2D("")).toStrictEqual(defaultDimensions);
  });

  test("square", () => {
    expect(toDimensions2D("20x20")).toStrictEqual({ width: 20, height: 20 });
  });

  test("rectangle", () => {
    expect(toDimensions2D("1920x1080")).toStrictEqual({ width: 1920, height: 1080 });
  });

  test("invalid format", () => {
    expect(toDimensions2D("20x")).toStrictEqual(defaultDimensions);
  });

  test("invalid format with letters", () => {
    expect(toDimensions2D("20x20a")).toStrictEqual(defaultDimensions);
  });

  test("invalid format with letters and spaces", () => {
    expect(toDimensions2D("20x 20a")).toStrictEqual(defaultDimensions);
  });

  test("invalid format with spaces", () => {
    expect(toDimensions2D("20 x 20")).toStrictEqual(defaultDimensions);
  });

  test("different separator", () => {
    expect(toDimensions2D("20/20")).toStrictEqual({ width: 20, height: 20 });
  });
});

describe("rectDistance", () => {
  test("identical rects have zero distance", () => {
    const r = createRect(0, 0, 10, 10);

    expect(rectDistance(r, r)).toBe(0);
  });

  test("rects with the same center have zero distance regardless of size", () => {
    const a = createRect(0, 0, 10, 10);
    const b = createRect(2.5, 2.5, 5, 5);

    expect(rectDistance(a, b)).toBe(0);
  });

  test("horizontal separation", () => {
    const a = createRect(0, 0, 10, 10);
    const b = createRect(30, 0, 10, 10);

    expect(rectDistance(a, b)).toBe(30);
  });

  test("vertical separation", () => {
    const a = createRect(0, 0, 10, 10);
    const b = createRect(0, 30, 10, 10);

    expect(rectDistance(a, b)).toBe(30);
  });

  test("diagonal separation (3-4-5 triangle)", () => {
    const a = createRect(0, 0, 0, 0);
    const b = createRect(3, 4, 0, 0);

    expect(rectDistance(a, b)).toBe(5);
  });

  test("is symmetric", () => {
    const a = createRect(0, 0, 10, 20);
    const b = createRect(100, 50, 30, 40);

    expect(rectDistance(a, b)).toBe(rectDistance(b, a));
  });

  test("accounts for rect size when computing centers", () => {
    const a = createRect(0, 0, 20, 0);
    const b = createRect(20, 0, 20, 0);

    expect(rectDistance(a, b)).toBe(20);
  });

  test("handles negative coordinates", () => {
    const a = createRect(-10, -10, 0, 0);
    const b = createRect(-7, -6, 0, 0);

    expect(rectDistance(a, b)).toBe(5);
  });
});

function createRect(left: number, top: number, width: number, height: number): DOMRectReadOnly {
  return { left, top, width, height } as DOMRectReadOnly;
}
