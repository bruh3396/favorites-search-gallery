import { Events } from "./events";
import { Timeout } from "../../../types/common_types";

let timer: Timeout;
const THRESHOLD = 300;

function stopHoldTimer(): void {
  if (timer !== undefined) {
    clearTimeout(timer);
    timer = undefined;
  }
}

function startHoldTimer(event: TouchEvent): void {
  if (timer === undefined) {
    timer = setTimeout(() => {
      Events.mobile.touchHold.emit(event);
    }, THRESHOLD);
  }
}

export function setupTouchHoldEvents(): void {
  Events.document.touchStart.on(startHoldTimer);
  Events.document.touchEnd.on(stopHoldTimer);
}
