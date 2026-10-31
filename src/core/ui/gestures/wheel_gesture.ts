import { ModifierState } from "@/core/ui/gestures/modifier_state";
import { Point } from "@/core/utils/geometry/point";

export interface WheelGesture {
  readonly point: Point;
  readonly deltaPoint: Point;
  readonly modifierState: ModifierState;
}
