import { EnhancedKeyboardEvent, EnhancedMouseEvent, EnhancedWheelEvent } from "@/types/input";
import { Emitter } from "@/lib/communication/emitter";
import { StickyEmitter } from "@/lib/communication/sticky_emitter";

export function toggleGlobalInputEvents(value: boolean): void {
  for (const event of Object.values(DomEvents.document)) {
    event.toggle(value);
  }
}

export function setupDomEvents(root: HTMLElement): void {
  broadcastDomLoad();
  setupDocumentEvents(root);
  setupWindowEvents();
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
    orientationChange: new Emitter<Event>(),
    scrollend: new Emitter<Event>(),
    scroll: new Emitter<Event>()
  }
};

function setupDocumentEvents(root: HTMLElement): void {
  root.addEventListener("click", (event) => {
    DomEvents.document.click.emit(event);
  });
  root.addEventListener("mousedown", (event) => {
    DomEvents.document.mousedown.emit(event);
  });
  document.addEventListener("keydown", (event) => {
    DomEvents.document.keydown.emit(new EnhancedKeyboardEvent(event));
  });
  document.addEventListener("keyup", (event) => {
    DomEvents.document.keyup.emit(new EnhancedKeyboardEvent(event));
  });
  root.addEventListener("mouseover", (event) => {
    DomEvents.document.mouseover.emit(new EnhancedMouseEvent(event));
  }, { passive: true });
  root.addEventListener("mousemove", (event) => {
    DomEvents.document.mousemove.emit(event);
  }, { passive: true });
  document.addEventListener("wheel", (event) => {
    DomEvents.document.wheel.emit(new EnhancedWheelEvent(event));
  }, { passive: true });
  root.addEventListener("contextmenu", (event) => {
    DomEvents.document.contextmenu.emit(event);
  });
  root.addEventListener("touchstart", (event) => {
    DomEvents.document.touchStart.emit(event);
  }, { passive: false });
  root.addEventListener("touchend", (event) => {
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
  window.addEventListener("scrollend", (event) => {
    DomEvents.window.scrollend.emit(event);
  }, { passive: true });
  window.addEventListener("scroll", (event) => {
    DomEvents.window.scroll.emit(event);
  }, { passive: true });
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

export function waitForDomToLoad(): Promise<void> {
  return new Promise((resolve) => {
    DomEvents.document.domLoaded.on(() => resolve(), { once: true });
  });
}
