import { EnhancedKeyboardEvent, EnhancedWheelEvent } from "../dom/input_types";
import { ON_DESKTOP_DEVICE, ON_FAVORITES_PAGE } from "../environment/environment";
import { Events } from "./events";
import { ROOT } from "../shell";
import { setupSwipeEvents } from "./swipe_events";
import { setupTouchHoldEvents } from "./touch_hold_events";

const CONTAINER = ON_FAVORITES_PAGE ? ROOT : document.documentElement;

function setupDocumentEvents(): void {
  CONTAINER.addEventListener("click", (event) => {
    Events.document.click.emit(event);
  });
  CONTAINER.addEventListener("mousedown", (event) => {
    Events.document.mousedown.emit(event);
  });
  document.addEventListener("keydown", (event) => {
    Events.document.keydown.emit(new EnhancedKeyboardEvent(event));
  });
  document.addEventListener("keyup", (event) => {
    Events.document.keyup.emit(new EnhancedKeyboardEvent(event));
  });
  document.addEventListener("wheel", (event) => {
    Events.document.wheel.emit(new EnhancedWheelEvent(event));
  }, { passive: true });
}

function setupWindowEvents(): void {
  window.addEventListener("focus", (event) => {
    Events.window.focus.emit(event);
  });
  window.addEventListener("blur", (event) => {
    Events.window.blur.emit(event);
  });
  window.addEventListener("orientationchange", (event) => {
    Events.window.orientationChange.emit(event);
  });
}

function setupMobileEvents(): void {
  if (ON_DESKTOP_DEVICE) {
    return;
  }
  setupTouchHoldEvents();
  setupSwipeEvents();
}

function broadcastDomLoad(): void {
  if (document.readyState !== "loading") {
    Events.document.domLoaded.emit();
    return;
  }
  document.addEventListener("DOMContentLoaded", () => {
    Events.document.domLoaded.emit();
  }, { once: true });
}

export function toggleGlobalInputEvents(value: boolean): void {
  for (const event of Object.values(Events.document)) {
    event.toggle(value);
  }
}

export function setupEvents(): void {
  broadcastDomLoad();
  setupDocumentEvents();
  setupWindowEvents();
  setupMobileEvents();
}
