import { describe, expect, test } from "vitest";
import { Rect } from "@/core/utils/geometry/rect";
import { containsPoint } from "@/core/utils/geometry/rect_utilities";

const RECT: Rect = { x: 10, y: 20, width: 100, height: 50 };

describe("containsPoint", () => {
  test("contains a point inside the rect", () => {
    expect(containsPoint(RECT, { x: 60, y: 45 })).toBe(true);
  });

  test("contains a point on each edge", () => {
    expect([
      containsPoint(RECT, { x: 10, y: 45 }),
      containsPoint(RECT, { x: 110, y: 45 }),
      containsPoint(RECT, { x: 60, y: 20 }),
      containsPoint(RECT, { x: 60, y: 70 })
    ]).toEqual([true, true, true, true]);
  });

  test("leaves out a point past any edge", () => {
    expect([
      containsPoint(RECT, { x: 9, y: 45 }),
      containsPoint(RECT, { x: 111, y: 45 }),
      containsPoint(RECT, { x: 60, y: 19 }),
      containsPoint(RECT, { x: 60, y: 71 })
    ]).toEqual([false, false, false, false]);
  });
});
