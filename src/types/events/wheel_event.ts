import { NavigationKey } from "../primitives/primitives";

export class FavoritesWheelEvent {
  public readonly originalEvent: WheelEvent;
  public readonly direction: NavigationKey;

  constructor(event: WheelEvent) {
    this.originalEvent = event;
    this.direction = event.deltaY > 0 ? "ArrowRight" : "ArrowLeft";
  }
}
