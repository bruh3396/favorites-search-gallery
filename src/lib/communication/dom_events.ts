import { EnhancedKeyboardEvent, EnhancedMouseEvent, EnhancedWheelEvent } from "../dom/input_types";
import { ON_DESKTOP_DEVICE, ON_FAVORITES_PAGE } from "../environment/environment";
import { Emitter } from "../core/scheduling/emitter";
import { Root } from "../shell";
import { StickyEmitter } from "../core/scheduling/sticky_emitter";
import { setupSwipeEvents } from "./swipe_events";
import { setupTouchHoldEvents } from "./touch_hold_events";

const container = ON_FAVORITES_PAGE ? Root : document.documentElement;

export function toggleGlobalInputEvents(value: boolean): void {
  for (const event of Object.values(DomEvents.document)) {
    event.toggle(value);
  }
}

export function setupEvents(): void {
  broadcastDomLoad();
  setupDocumentEvents();
  setupWindowEvents();
  setupMobileEvents();
}

export const DomEvents = {
  document: {
    domLoaded: new StickyEmitter<void>(),
    mouseover: new Emitter<EnhancedMouseEvent>(),
    click: new Emitter<MouseEvent>(),
    mousedown: new Emitter<MouseEvent>(),
    touchStart: new Emitter<TouchEvent>(),
    touchEnd: new Emitter<TouchEvent>(),
    keydown: new Emitter<EnhancedKeyboardEvent>(),
    keyup: new Emitter<EnhancedKeyboardEvent>(),
    wheel: new Emitter<EnhancedWheelEvent>(),
    contextmenu: new Emitter<MouseEvent>(),
    mousemove: new Emitter<MouseEvent>()
  },
  window: {
    focus: new Emitter<FocusEvent>(),
    blur: new Emitter<FocusEvent>(),
    orientationChange: new Emitter<Event>()
  }
};

function setupDocumentEvents(): void {
  container.addEventListener("click", (event) => {
    DomEvents.document.click.emit(event);
  });
  container.addEventListener("mousedown", (event) => {
    DomEvents.document.mousedown.emit(event);
  });
  document.addEventListener("keydown", (event) => {
    DomEvents.document.keydown.emit(new EnhancedKeyboardEvent(event));
  });
  document.addEventListener("keyup", (event) => {
    DomEvents.document.keyup.emit(new EnhancedKeyboardEvent(event));
  });
  container.addEventListener("mouseover", (event) => {
    DomEvents.document.mouseover.emit(new EnhancedMouseEvent(event));
  }, { passive: true });
  container.addEventListener("mousemove", (event) => {
    DomEvents.document.mousemove.emit(event);
  }, { passive: true });
  document.addEventListener("wheel", (event) => {
    DomEvents.document.wheel.emit(new EnhancedWheelEvent(event));
  }, { passive: true });
  container.addEventListener("contextmenu", (event) => {
    DomEvents.document.contextmenu.emit(event);
  });
  container.addEventListener("touchstart", (event) => {
    DomEvents.document.touchStart.emit(event);
  }, { passive: false });
  container.addEventListener("touchend", (event) => {
    DomEvents.document.touchEnd.emit(event);
  });
}

function setupWindowEvents(): void {
  window.addEventListener("focus", (event) => {
    DomEvents.window.focus.emit(event);
  });
  window.addEventListener("blur", (event) => {
    DomEvents.window.blur.emit(event);
  });
  window.addEventListener("orientationchange", (event) => {
    DomEvents.window.orientationChange.emit(event);
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
    DomEvents.document.domLoaded.emit();
    return;
  }
  document.addEventListener("DOMContentLoaded", () => {
    DomEvents.document.domLoaded.emit();
  }, { once: true });
}
