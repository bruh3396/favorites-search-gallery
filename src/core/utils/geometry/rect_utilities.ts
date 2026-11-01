import { Point } from "@/core/utils/geometry/point";
import { Rect } from "@/core/utils/geometry/rect";

export function containsPoint(rect: Rect, point: Point): boolean {
  return point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;
}
