import { DragGesture } from "@/core/ui/gestures/drag_gesture";
import { PressGesture } from "@/core/ui/gestures/press_gesture";
import { TapGesture } from "@/core/ui/gestures/tap_gesture";
import { WheelGesture } from "@/core/ui/gestures/wheel_gesture";

export interface GestureHandlers {
  canDrag(): boolean;
  onPress(gesture: PressGesture): boolean;
  onTap(gesture: TapGesture): void;
  onDrag(gesture: DragGesture): void;
  onWheel(gesture: WheelGesture): boolean;
}
