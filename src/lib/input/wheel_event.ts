import { NavigationKey } from "@/types/input";

export class EnhancedWheelEvent {
  public readonly originalEvent: WheelEvent;
  public readonly direction: NavigationKey;

  constructor(event: WheelEvent) {
    this.originalEvent = event;
    this.direction = event.deltaY > 0 ? "ArrowRight" : "ArrowLeft";
  }
}
