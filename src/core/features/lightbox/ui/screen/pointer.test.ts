import { LightboxPointerListeners, LightboxPointerZoom, createPointerListeners } from "@/core/features/lightbox/ui/screen/pointer";
import { describe, expect, test, vi } from "vitest";

type Action = ReturnType<typeof vi.fn<() => void>>;

interface Setup {
  listeners: LightboxPointerListeners;
  show: Action;
  hideSoon: Action;
  showNext: Action;
  showPrevious: Action;
  close: Action;
  onCtrlClick: Action;
  onMiddleClick: Action;
  zoom: FakeZoom;
}

interface FakeZoom extends LightboxPointerZoom {
  zoomed: boolean;
  toggledAt: MouseEvent[];
  factors: number[];
  pans: [number, number][];
}

function createFakeZoom(): FakeZoom {
  const zoom: FakeZoom = {
    zoomed: false,
    toggledAt: [],
    factors: [],
    pans: [],
    isZoomed: () => zoom.zoomed,
    toggleAt: event => zoom.toggledAt.push(event),
    zoomByAt: factor => zoom.factors.push(factor),
    zoomOut: (): void => {
      zoom.zoomed = false;
    },
    panBy: (deltaX, deltaY) => zoom.pans.push([deltaX, deltaY])
  };
  return zoom;
}

function setup(): Setup {
  const zoom = createFakeZoom();
  const show = vi.fn<() => void>();
  const hideSoon = vi.fn<() => void>();
  const showNext = vi.fn<() => void>();
  const showPrevious = vi.fn<() => void>();
  const close = vi.fn<() => void>();
  const onCtrlClick = vi.fn<() => void>();
  const onMiddleClick = vi.fn<() => void>();
  const listeners = createPointerListeners({ visibility: { show, hideSoon }, zoom, showNext, showPrevious, close, onCtrlClick, onMiddleClick });
  return { listeners, show, hideSoon, showNext, showPrevious, close, onCtrlClick, onMiddleClick, zoom };
}

function drag(listeners: LightboxPointerListeners, points: readonly [number, number][]): void {
  const [[startX, startY], ...rest] = points;

  listeners.onPointerdown(new PointerEvent("pointerdown", { button: 0, clientX: startX, clientY: startY }));
  rest.forEach(([clientX, clientY]) => listeners.onPointermove(new PointerEvent("pointermove", { pointerType: "mouse", buttons: 1, clientX, clientY })));
  listeners.onPointerup();
}

function clickOn(target: Element, init: MouseEventInit = {}): MouseEvent {
  const event = new MouseEvent("click", { cancelable: true, ...init });

  Object.defineProperty(event, "target", { value: target });
  return event;
}

function movePointer(init: PointerEventInit): PointerEvent {
  return new PointerEvent("pointermove", { pointerType: "mouse", ...init });
}

describe("createPointerListeners", () => {
  test("closes on a plain click", () => {
    const { listeners, close } = setup();

    listeners.onClick(clickOn(document.createElement("img")));
    expect(close).toHaveBeenCalledOnce();
  });

  test("leaves a click on a video to the video", () => {
    const { listeners, close } = setup();

    listeners.onClick(clickOn(document.createElement("video")));
    expect(close).not.toHaveBeenCalled();
  });

  test("zooms on a Shift click instead of closing", () => {
    const { listeners, close, zoom } = setup();
    const shiftClick = clickOn(document.createElement("img"), { shiftKey: true });

    listeners.onClick(shiftClick);
    expect([zoom.toggledAt, close.mock.calls.length]).toEqual([[shiftClick], 0]);
  });

  test("zooms out on a click while zoomed instead of closing", () => {
    const { listeners, close, zoom } = setup();

    zoom.zoomed = true;
    listeners.onClick(clickOn(document.createElement("img")));
    expect([zoom.zoomed, close.mock.calls.length]).toEqual([false, 0]);
  });

  test("pans by each move of a drag while zoomed", () => {
    const { listeners, zoom } = setup();

    zoom.zoomed = true;
    drag(listeners, [[0, 0], [10, 0], [15, -5]]);
    expect(zoom.pans).toEqual([[10, 0], [5, -5]]);
  });

  test("ignores the click that ends a drag, and only that one", () => {
    const { listeners, close } = setup();

    drag(listeners, [[0, 0], [10, 0]]);
    listeners.onClick(clickOn(document.createElement("img")));
    listeners.onClick(clickOn(document.createElement("img")));
    expect(close).toHaveBeenCalledOnce();
  });

  test("keeps the pointer through a drag while zoomed", () => {
    const { listeners, zoom } = setup();
    const target = document.createElement("div");
    const setPointerCapture = vi.fn<(pointerId: number) => void>();

    zoom.zoomed = true;
    target.setPointerCapture = setPointerCapture;
    target.addEventListener("pointermove", event => listeners.onPointermove(event));
    listeners.onPointerdown(new PointerEvent("pointerdown", { button: 0 }));
    target.dispatchEvent(new PointerEvent("pointermove", { pointerType: "mouse", pointerId: 7, clientX: 10 }));
    expect(setPointerCapture.mock.calls).toEqual([[7]]);
  });

  test("stops a drag the browser cancels", () => {
    const { listeners, zoom } = setup();

    zoom.zoomed = true;
    listeners.onPointerdown(new PointerEvent("pointerdown", { button: 0 }));
    listeners.onPointercancel();
    listeners.onPointermove(new PointerEvent("pointermove", { pointerType: "mouse", clientX: 10 }));
    expect(zoom.pans).toEqual([]);
  });

  test("never drags with another button", () => {
    const { listeners, close } = setup();

    listeners.onPointerdown(new PointerEvent("pointerdown", { button: 2 }));
    listeners.onPointermove(new PointerEvent("pointermove", { pointerType: "mouse", clientX: 10 }));
    listeners.onPointerup();
    listeners.onClick(clickOn(document.createElement("img")));
    expect(close).toHaveBeenCalledOnce();
  });

  test("keeps the browser from dragging the image away", () => {
    const { listeners } = setup();
    const dragStart = new Event("dragstart", { cancelable: true }) as DragEvent;

    listeners.onDragstart(dragStart);
    expect(dragStart.defaultPrevented).toBe(true);
  });

  test("treats a press that barely moves as a click", () => {
    const { listeners, close, zoom } = setup();

    drag(listeners, [[0, 0], [3, 0]]);
    listeners.onClick(clickOn(document.createElement("img")));
    expect([close.mock.calls.length, zoom.pans]).toEqual([1, []]);
  });

  test("reports a Ctrl or Meta click instead of closing, even on a video", () => {
    const { listeners, close, onCtrlClick } = setup();
    const ctrlClick = clickOn(document.createElement("img"), { ctrlKey: true });

    listeners.onClick(ctrlClick);
    listeners.onClick(clickOn(document.createElement("video"), { metaKey: true }));
    expect([onCtrlClick.mock.calls.length, ctrlClick.defaultPrevented, close.mock.calls.length]).toEqual([2, true, 0]);
  });

  test("closes on a right click instead of opening the context menu", () => {
    const { listeners, close } = setup();
    const contextMenu = new MouseEvent("contextmenu", { cancelable: true });

    listeners.onContextmenu(contextMenu);
    expect([contextMenu.defaultPrevented, close.mock.calls.length]).toEqual([true, 1]);
  });

  test("reports a middle click and ignores other auxiliary clicks", () => {
    const { listeners, onMiddleClick } = setup();
    const middleClick = new MouseEvent("auxclick", { cancelable: true, button: 1 });

    listeners.onAuxclick(middleClick);
    listeners.onAuxclick(new MouseEvent("auxclick", { button: 2 }));
    expect([onMiddleClick.mock.calls.length, middleClick.defaultPrevented]).toEqual([1, true]);
  });

  test("prevents autoscroll on a middle press and leaves other presses alone", () => {
    const { listeners } = setup();
    const middle = new MouseEvent("mousedown", { cancelable: true, button: 1 });
    const left = new MouseEvent("mousedown", { cancelable: true, button: 0 });

    listeners.onMousedown(middle);
    listeners.onMousedown(left);
    expect([middle.defaultPrevented, left.defaultPrevented]).toEqual([true, false]);
  });

  test("asks for the next post on a wheel down and the previous one on a wheel up", () => {
    const { listeners, showNext, showPrevious } = setup();
    const down = new WheelEvent("wheel", { deltaY: 100, cancelable: true });

    listeners.onWheel(down);
    listeners.onWheel(new WheelEvent("wheel", { deltaY: -100 }));
    expect([down.defaultPrevented, showNext.mock.calls.length, showPrevious.mock.calls.length]).toEqual([true, 1, 1]);
  });

  test("leaves a sideways wheel to the browser while fitted", () => {
    const { listeners, showNext, showPrevious } = setup();
    const sideways = new WheelEvent("wheel", { deltaX: 100, cancelable: true });

    listeners.onWheel(sideways);
    expect([sideways.defaultPrevented, showNext.mock.calls.length, showPrevious.mock.calls.length]).toEqual([false, 0, 0]);
  });

  test("zooms in on a Ctrl wheel up and back out by as much on a Ctrl wheel down, instead of stepping", () => {
    const { listeners, showNext, zoom } = setup();
    const up = new WheelEvent("wheel", { deltaY: -100, cancelable: true });
    const down = new WheelEvent("wheel", { deltaY: 100 });

    // happy-dom's WheelEvent extends UIEvent, so it drops ctrlKey from its init.
    [up, down].forEach(event => Object.defineProperty(event, "ctrlKey", { value: true }));
    listeners.onWheel(up);
    listeners.onWheel(down);
    expect(zoom.factors[0] * zoom.factors[1]).toBeCloseTo(1);
    expect([zoom.factors[0] > 1, up.defaultPrevented, showNext.mock.calls.length]).toEqual([true, true, 0]);
  });

  test("pans with the wheel while zoomed instead of stepping", () => {
    const { listeners, showNext, zoom } = setup();
    const wheel = new WheelEvent("wheel", { deltaX: 20, deltaY: 100, cancelable: true });

    zoom.zoomed = true;
    listeners.onWheel(wheel);
    expect([zoom.pans, wheel.defaultPrevented, showNext.mock.calls.length]).toEqual([[[-20, -100]], true, 0]);
  });

  test("shows the controls when the mouse moves to a new place, ignoring touch", () => {
    const { listeners, show } = setup();

    listeners.onPointermove(movePointer({ screenX: 10 }));
    listeners.onPointermove(movePointer({ screenX: 10 }));
    listeners.onPointermove(movePointer({ screenX: 20, pointerType: "touch" }));
    expect(show).toHaveBeenCalledOnce();
  });

  test("hides the controls soon after the pointer leaves", () => {
    const { listeners, hideSoon } = setup();

    listeners.onPointerleave();
    expect(hideSoon).toHaveBeenCalledOnce();
  });
});
