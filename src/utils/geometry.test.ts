import { describe, expect, test } from "vitest";
import { getRectDistance } from "@/utils/geometry";

function rect(left: number, top: number, width: number, height: number): DOMRectReadOnly {
  return { left, top, width, height } as DOMRectReadOnly;
}

describe("getRectDistance", () => {
  test("identical rects have zero distance", () => {
    const r = rect(0, 0, 10, 10);

    expect(getRectDistance(r, r)).toBe(0);
  });

  test("rects with the same center have zero distance regardless of size", () => {
    const a = rect(0, 0, 10, 10);
    const b = rect(2.5, 2.5, 5, 5);

    expect(getRectDistance(a, b)).toBe(0);
  });

  test("horizontal separation", () => {
    const a = rect(0, 0, 10, 10);
    const b = rect(30, 0, 10, 10);

    expect(getRectDistance(a, b)).toBe(30);
  });

  test("vertical separation", () => {
    const a = rect(0, 0, 10, 10);
    const b = rect(0, 30, 10, 10);

    expect(getRectDistance(a, b)).toBe(30);
  });

  test("diagonal separation (3-4-5 triangle)", () => {
    const a = rect(0, 0, 0, 0);
    const b = rect(3, 4, 0, 0);

    expect(getRectDistance(a, b)).toBe(5);
  });

  test("is symmetric", () => {
    const a = rect(0, 0, 10, 20);
    const b = rect(100, 50, 30, 40);

    expect(getRectDistance(a, b)).toBe(getRectDistance(b, a));
  });

  test("accounts for rect size when computing centers", () => {
    const a = rect(0, 0, 20, 0);
    const b = rect(20, 0, 20, 0);

    expect(getRectDistance(a, b)).toBe(20);
  });

  test("handles negative coordinates", () => {
    const a = rect(-10, -10, 0, 0);
    const b = rect(-7, -6, 0, 0);

    expect(getRectDistance(a, b)).toBe(5);
  });
});
