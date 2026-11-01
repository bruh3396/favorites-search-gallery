import { describe, expect, test, vi } from "vitest";
import { createLightboxMouseListeners } from "@/core/features/lightbox/commands/lightbox_mouse_listeners";

function setup(): {
  handlers: { openPostPage: () => void; close: () => void };
  lightboxMouseListeners: ReturnType<typeof createLightboxMouseListeners>;
} {
  const handlers = { openPostPage: vi.fn(), close: vi.fn() };
  return { handlers, lightboxMouseListeners: createLightboxMouseListeners(handlers) };
}

function createWheelEvent(init: MouseEventInit): WheelEvent {
  return new MouseEvent("wheel", { cancelable: true, ...init }) as WheelEvent;
}

function createContextmenuEvent(): MouseEvent {
  return new MouseEvent("contextmenu", { cancelable: true });
}

describe("createLightboxMouseListeners", () => {
  test("blocks page zoom on ctrl+wheel", () => {
    const { lightboxMouseListeners } = setup();
    const event = createWheelEvent({ ctrlKey: true });

    lightboxMouseListeners.onWheel(event);
    expect(event.defaultPrevented).toBe(true);
  });

  test("lets a plain wheel through", () => {
    const { lightboxMouseListeners } = setup();
    const event = createWheelEvent({});

    lightboxMouseListeners.onWheel(event);
    expect(event.defaultPrevented).toBe(false);
  });

  test("blocks autoscroll on middle mousedown", () => {
    const { lightboxMouseListeners } = setup();
    const event = new MouseEvent("mousedown", { button: 1, cancelable: true });

    lightboxMouseListeners.onMousedown(event);
    expect(event.defaultPrevented).toBe(true);
  });

  test("lets a left mousedown through", () => {
    const { handlers, lightboxMouseListeners } = setup();
    const event = new MouseEvent("mousedown", { button: 0, cancelable: true });

    lightboxMouseListeners.onMousedown(event);
    expect(event.defaultPrevented).toBe(false);
    expect(handlers.close).not.toHaveBeenCalled();
  });

  test("closes on right mousedown", () => {
    const { handlers, lightboxMouseListeners } = setup();

    lightboxMouseListeners.onMousedown(new MouseEvent("mousedown", { button: 2, cancelable: true }));
    expect(handlers.close).toHaveBeenCalledOnce();
  });

  test("opens the post page on middle click", () => {
    const { handlers, lightboxMouseListeners } = setup();
    const event = new MouseEvent("auxclick", { button: 1, cancelable: true });

    lightboxMouseListeners.onAuxclick(event);
    expect(handlers.openPostPage).toHaveBeenCalledOnce();
    expect(event.defaultPrevented).toBe(true);
  });

  test("ignores other auxiliary buttons", () => {
    const { handlers, lightboxMouseListeners } = setup();

    lightboxMouseListeners.onAuxclick(new MouseEvent("auxclick", { button: 2, cancelable: true }));
    expect(handlers.openPostPage).not.toHaveBeenCalled();
  });

  test("blocks only the contextmenu that follows a right mousedown", () => {
    const { lightboxMouseListeners } = setup();
    const following = createContextmenuEvent();
    const later = createContextmenuEvent();

    lightboxMouseListeners.onMousedown(new MouseEvent("mousedown", { button: 2, view: window }));
    window.dispatchEvent(following);
    window.dispatchEvent(later);
    expect([following.defaultPrevented, later.defaultPrevented]).toEqual([true, false]);
  });

  test("stops blocking the contextmenu after another mousedown", () => {
    const { lightboxMouseListeners } = setup();
    const event = createContextmenuEvent();

    lightboxMouseListeners.onMousedown(new MouseEvent("mousedown", { button: 2, view: window }));
    window.dispatchEvent(new MouseEvent("mousedown"));
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });
});
