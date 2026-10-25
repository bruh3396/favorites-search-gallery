import { GestureHandlers, GesturePoint, Gestures } from "@/core/ui/gestures/gestures";
import { Mock, describe, expect, test, vi } from "vitest";
import { createScope } from "@/core/utils/reactive/scope";

const DRAG_THRESHOLD = 5;

function setup(canDrag = false): {
  gestures: Gestures;
  element: HTMLElement;
  handlers: { [K in keyof GestureHandlers]: Mock<GestureHandlers[K]> };
  dispose: () => void;
} {
  const element = document.createElement("div");
  const handlers = {
    canDrag: vi.fn(() => canDrag),
    onPress: vi.fn<GestureHandlers["onPress"]>(() => false),
    onTap: vi.fn<GestureHandlers["onTap"]>(),
    onDrag: vi.fn<GestureHandlers["onDrag"]>(),
    onWheel: vi.fn<GestureHandlers["onWheel"]>(() => true)
  };
  const { result: gestures, dispose } = createScope(() => new Gestures({ dragThreshold: DRAG_THRESHOLD }, { element, handlers }));

  element.setPointerCapture = vi.fn();
  element.getBoundingClientRect = (): DOMRect => ({ left: 10, top: 20 }) as DOMRect;
  return { gestures, element, handlers, dispose };
}

function point(type: string, { x, y }: GesturePoint, init: PointerEventInit = {}): PointerEvent {
  return new PointerEvent(type, { pointerId: 1, isPrimary: true, button: 0, clientX: x, clientY: y, ...init });
}

describe("Gestures", () => {
  test("reports a press released in place as a tap, at the point within the element", () => {
    const { element, handlers } = setup();

    element.dispatchEvent(point("pointerdown", { x: 30, y: 40 }));
    element.dispatchEvent(point("pointermove", { x: 32, y: 41 }));
    element.dispatchEvent(point("pointerup", { x: 32, y: 41 }, { shiftKey: true }));
    expect(handlers.onTap).toHaveBeenCalledWith({ point: { x: 22, y: 21 }, modifiers: { shift: true, ctrl: false, alt: false, meta: false } });
  });

  test("reports a press at the point within the element", () => {
    const { element, handlers } = setup();

    element.dispatchEvent(point("pointerdown", { x: 30, y: 40 }, { ctrlKey: true }));
    expect(handlers.onPress).toHaveBeenCalledWith({ point: { x: 20, y: 20 }, modifiers: { shift: false, ctrl: true, alt: false, meta: false } });
  });

  test("reports neither a tap nor a drag after a handled press", () => {
    const { element, handlers } = setup(true);

    handlers.onPress.mockReturnValue(true);
    element.dispatchEvent(point("pointerdown", { x: 30, y: 40 }));
    element.dispatchEvent(point("pointermove", { x: 40, y: 40 }));
    element.dispatchEvent(point("pointerup", { x: 40, y: 40 }));
    expect(element.setPointerCapture).not.toHaveBeenCalled();
    expect(handlers.onDrag).not.toHaveBeenCalled();
    expect(handlers.onTap).not.toHaveBeenCalled();
  });

  test("ignores presses from other buttons and secondary pointers", () => {
    const { element, handlers } = setup();

    element.dispatchEvent(point("pointerdown", { x: 30, y: 40 }, { button: 2 }));
    element.dispatchEvent(point("pointerup", { x: 30, y: 40 }));
    element.dispatchEvent(point("pointerdown", { x: 30, y: 40 }, { isPrimary: false }));
    element.dispatchEvent(point("pointerup", { x: 30, y: 40 }));
    expect(handlers.onTap).not.toHaveBeenCalled();
  });

  test("ignores a release from another pointer", () => {
    const { element, handlers } = setup();

    element.dispatchEvent(point("pointerdown", { x: 30, y: 40 }));
    element.dispatchEvent(point("pointerup", { x: 30, y: 40 }, { pointerId: 2 }));
    expect(handlers.onTap).not.toHaveBeenCalled();
  });

  test("drops a press the browser cancels", () => {
    const { element, handlers } = setup();

    element.dispatchEvent(point("pointerdown", { x: 30, y: 40 }));
    element.dispatchEvent(point("pointercancel", { x: 30, y: 40 }));
    element.dispatchEvent(point("pointerup", { x: 30, y: 40 }));
    expect(handlers.onTap).not.toHaveBeenCalled();
  });

  test("drags by each move once dragging is allowed, capturing the pointer", () => {
    const { gestures, element, handlers } = setup(true);

    element.dispatchEvent(point("pointerdown", { x: 30, y: 40 }));
    expect(element.setPointerCapture).toHaveBeenCalledWith(1);
    element.dispatchEvent(point("pointermove", { x: 33, y: 40 }));
    expect(gestures.isDragging.value).toBe(false);
    element.dispatchEvent(point("pointermove", { x: 40, y: 40 }));
    expect(gestures.isDragging.value).toBe(true);
    element.dispatchEvent(point("pointerup", { x: 40, y: 40 }));
    expect(gestures.isDragging.value).toBe(false);
    expect(handlers.onDrag.mock.calls.map(([drag]) => drag.delta)).toEqual([{ x: 3, y: 0 }, { x: 7, y: 0 }]);
    expect(handlers.onTap).not.toHaveBeenCalled();
  });

  test("reports neither a drag nor a tap for a press moved past the threshold when dragging isn't allowed", () => {
    const { gestures, element, handlers } = setup();

    element.dispatchEvent(point("pointerdown", { x: 30, y: 40 }));
    element.dispatchEvent(point("pointermove", { x: 40, y: 40 }));
    element.dispatchEvent(point("pointerup", { x: 40, y: 40 }));
    expect(element.setPointerCapture).not.toHaveBeenCalled();
    expect(gestures.isDragging.value).toBe(false);
    expect(handlers.onDrag).not.toHaveBeenCalled();
    expect(handlers.onTap).not.toHaveBeenCalled();
  });

  test("tracks the hovered point until the pointer leaves", () => {
    const { gestures, element } = setup();

    element.dispatchEvent(point("pointermove", { x: 30, y: 40 }));
    expect(gestures.hoverPoint.value).toEqual({ x: 20, y: 20 });
    element.dispatchEvent(point("pointerleave", { x: 30, y: 40 }));
    expect(gestures.hoverPoint.value).toBeUndefined();
  });

  test("passes the wheel on and keeps the page from scrolling only when it is handled", () => {
    const { element, handlers } = setup();
    const handled = new WheelEvent("wheel", { deltaX: 1, deltaY: 2, cancelable: true });
    const unhandled = new WheelEvent("wheel", { cancelable: true });

    Object.defineProperties(handled, { clientX: { value: 30 }, clientY: { value: 40 }, ctrlKey: { value: true } });
    element.dispatchEvent(handled);
    handlers.onWheel.mockReturnValue(false);
    element.dispatchEvent(unhandled);
    expect(handlers.onWheel).toHaveBeenNthCalledWith(1, {
      point: { x: 20, y: 20 },
      delta: { x: 1, y: 2 },
      modifiers: expect.objectContaining({ ctrl: true })
    });
    expect([handled.defaultPrevented, unhandled.defaultPrevented]).toEqual([true, false]);
  });

  test("blocks native dragging only while it can drag", () => {
    const { element, handlers } = setup(true);
    const blocked = new Event("dragstart", { cancelable: true });
    const allowed = new Event("dragstart", { cancelable: true });

    element.dispatchEvent(blocked);
    handlers.canDrag.mockReturnValue(false);
    element.dispatchEvent(allowed);
    expect([blocked.defaultPrevented, allowed.defaultPrevented]).toEqual([true, false]);
  });

  test("stops listening once its scope is disposed", () => {
    const { element, handlers, dispose } = setup();

    dispose();
    element.dispatchEvent(point("pointerdown", { x: 30, y: 40 }));
    element.dispatchEvent(point("pointerup", { x: 30, y: 40 }));
    expect(handlers.onTap).not.toHaveBeenCalled();
  });
});
