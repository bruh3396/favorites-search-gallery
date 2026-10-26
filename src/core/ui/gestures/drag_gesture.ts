import { Point } from "@/core/utils/geometry/point";

export interface DragGesture {
  readonly point: Point;
  readonly delta: Point;
}
