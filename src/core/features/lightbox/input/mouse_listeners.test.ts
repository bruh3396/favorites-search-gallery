import { describe, expect, test, vi } from "vitest";
import { createLightboxMouseListeners } from "@/core/features/lightbox/input/mouse_listeners";

function setup(): {
  handlers: { openPostPage: () => void; close: () => void };
  listeners: ReturnType<typeof createLightboxMouseListeners>;
} {
  const handlers = { openPostPage: vi.fn(), close: vi.fn() };
  return { handlers, listeners: createLightboxMouseListeners(handlers) };
}

function createWheelEvent(init: MouseEventInit): WheelEvent {
  return new MouseEvent("wheel", { cancelable: true, ...init }) as WheelEvent;
}

function createContextmenuEvent(): MouseEvent {
  return new MouseEvent("contextmenu", { cancelable: true });
}

describe("createLightboxMouseListeners", () => {
  test("blocks page zoom on ctrl+wheel", () => {
    const { listeners } = setup();
    const event = createWheelEvent({ ctrlKey: true });

    listeners.onWheel(event);
    expect(event.defaultPrevented).toBe(true);
  });

  test("lets a plain wheel through", () => {
    const { listeners } = setup();
    const event = createWheelEvent({});

    listeners.onWheel(event);
    expect(event.defaultPrevented).toBe(false);
  });

  test("blocks autoscroll on middle mousedown", () => {
    const { listeners } = setup();
    const event = new MouseEvent("mousedown", { button: 1, cancelable: true });

    listeners.onMousedown(event);
    expect(event.defaultPrevented).toBe(true);
  });

  test("lets a left mousedown through", () => {
    const { handlers, listeners } = setup();
    const event = new MouseEvent("mousedown", { button: 0, cancelable: true });

    listeners.onMousedown(event);
    expect(event.defaultPrevented).toBe(false);
    expect(handlers.close).not.toHaveBeenCalled();
  });

  test("closes on right mousedown", () => {
    const { handlers, listeners } = setup();

    listeners.onMousedown(new MouseEvent("mousedown", { button: 2, cancelable: true }));
    expect(handlers.close).toHaveBeenCalledOnce();
  });

  test("opens the post page on middle click", () => {
    const { handlers, listeners } = setup();
    const event = new MouseEvent("auxclick", { button: 1, cancelable: true });

    listeners.onAuxclick(event);
    expect(handlers.openPostPage).toHaveBeenCalledOnce();
    expect(event.defaultPrevented).toBe(true);
  });

  test("ignores other auxiliary buttons", () => {
    const { handlers, listeners } = setup();

    listeners.onAuxclick(new MouseEvent("auxclick", { button: 2, cancelable: true }));
    expect(handlers.openPostPage).not.toHaveBeenCalled();
  });

  test("blocks only the contextmenu that follows a right mousedown", () => {
    const { listeners } = setup();
    const following = createContextmenuEvent();
    const later = createContextmenuEvent();

    listeners.onMousedown(new MouseEvent("mousedown", { button: 2, view: window }));
    window.dispatchEvent(following);
    window.dispatchEvent(later);
    expect([following.defaultPrevented, later.defaultPrevented]).toEqual([true, false]);
  });

  test("stops blocking the contextmenu after another mousedown", () => {
    const { listeners } = setup();
    const event = createContextmenuEvent();

    listeners.onMousedown(new MouseEvent("mousedown", { button: 2, view: window }));
    window.dispatchEvent(new MouseEvent("mousedown"));
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });
});
