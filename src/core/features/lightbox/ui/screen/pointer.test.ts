import { LightboxPointerListeners, createPointerListeners } from "@/core/features/lightbox/ui/screen/pointer";
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
}

function setup(): Setup {
  const show = vi.fn<() => void>();
  const hideSoon = vi.fn<() => void>();
  const showNext = vi.fn<() => void>();
  const showPrevious = vi.fn<() => void>();
  const close = vi.fn<() => void>();
  const onCtrlClick = vi.fn<() => void>();
  const onMiddleClick = vi.fn<() => void>();
  const listeners = createPointerListeners({ visibility: { show, hideSoon }, showNext, showPrevious, close, onCtrlClick, onMiddleClick });
  return { listeners, show, hideSoon, showNext, showPrevious, close, onCtrlClick, onMiddleClick };
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

  test("leaves a ctrl wheel and a sideways wheel to the browser", () => {
    const { listeners, showNext, showPrevious } = setup();
    const zoom = new WheelEvent("wheel", { deltaY: 100, cancelable: true });

    // happy-dom's WheelEvent extends UIEvent, so it drops ctrlKey from its init.
    Object.defineProperty(zoom, "ctrlKey", { value: true });
    listeners.onWheel(zoom);
    listeners.onWheel(new WheelEvent("wheel", { deltaX: 100 }));
    expect([zoom.defaultPrevented, showNext.mock.calls.length, showPrevious.mock.calls.length]).toEqual([false, 0, 0]);
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
