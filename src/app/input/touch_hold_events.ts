import { DomEvents } from "./dom_events";
import { Events } from "../channels/events";
import { ON_MOBILE_DEVICE } from "../../lib/environment";
import { Timeout } from "../../types/async";

let timer: Timeout;
const THRESHOLD = 300;

export function setupTouchHoldEvents(): void {
  if (ON_MOBILE_DEVICE) {
    DomEvents.document.touchStart.on(startHoldTimer);
    DomEvents.document.touchEnd.on(stopHoldTimer);
  }
}

function startHoldTimer(event: TouchEvent): void {
  stopHoldTimer();

  timer = setTimeout(() => {
    Events.mobile.touchHold.emit(event);
  }, THRESHOLD);
}

function stopHoldTimer(): void {
  if (timer !== undefined) {
    clearTimeout(timer);
    timer = undefined;
  }
}
