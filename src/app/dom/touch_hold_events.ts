import { DomEvents } from "@/app/dom/events";
import { ON_MOBILE_DEVICE } from "@/lib/environment";
import { Timeout } from "@/types/async";

let timer: Timeout;
let wasHeld = false;
const THRESHOLD = 300;

export function setupTouchHoldEvents(): void {
  if (ON_MOBILE_DEVICE) {
    DomEvents.document.touchStart.on(startHoldTimer);
    DomEvents.document.touchEnd.on(stopHoldTimer);
  }
}

export const didHold = (): boolean => wasHeld;

function startHoldTimer(event: TouchEvent): void {
  stopHoldTimer();
  wasHeld = false;

  timer = setTimeout(() => {
    wasHeld = true;
    DomEvents.mobile.touchHold.emit(event);
  }, THRESHOLD);
}

function stopHoldTimer(): void {
  if (timer !== undefined) {
    clearTimeout(timer);
    timer = undefined;
  }
}
