import { ModifierState } from "@/core/ui/gestures/modifier_state";
import { Point } from "@/core/utils/geometry/point";

export interface TapGesture {
  readonly point: Point;
  readonly modifiers: ModifierState;
}
