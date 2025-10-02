import { Events } from "./events";
import { Timeout } from "../../../types/common_types";

let timer: Timeout;
let target: EventTarget | null = null;
const THRESHOLD = 300;

function stopHoldTimer(): void {

  if (timer !== undefined) {
    clearTimeout(timer);
    timer = undefined;
  }
  target = null;
}

function startHoldTimer(event: TouchEvent): void {
  target = event.target;

  if (timer === undefined) {
    timer = setTimeout(() => {

      if (target instanceof EventTarget) {
        Events.mobile.touchHold.emit(target);
      }
    }, THRESHOLD);
  }
}

export function setupTouchHoldEvents(): void {
  Events.document.touchStart.on(startHoldTimer);
  Events.document.touchEnd.on(stopHoldTimer);
}
