import { LightboxPointerListeners, createPointerListeners } from "@/core/ui/lightbox/screen/pointer";
import { describe, expect, test, vi } from "vitest";

type Action = ReturnType<typeof vi.fn<() => void>>;

interface Setup {
  listeners: LightboxPointerListeners;
  show: Action;
  hideSoon: Action;
  onShowNext: Action;
  onShowPrevious: Action;
  onClose: Action;
  onCtrlClick: Action;
  onMiddleClick: Action;
}

function setup(): Setup {
  const show = vi.fn<() => void>();
  const hideSoon = vi.fn<() => void>();
  const onShowNext = vi.fn<() => void>();
  const onShowPrevious = vi.fn<() => void>();
  const onClose = vi.fn<() => void>();
  const onCtrlClick = vi.fn<() => void>();
  const onMiddleClick = vi.fn<() => void>();
  const listeners = createPointerListeners({ visibility: { show, hideSoon }, onShowNext, onShowPrevious, onClose, onCtrlClick, onMiddleClick });
  return { listeners, show, hideSoon, onShowNext, onShowPrevious, onClose, onCtrlClick, onMiddleClick };
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
    const { listeners, onClose } = setup();

    listeners.onClick(clickOn(document.createElement("img")));
    expect(onClose).toHaveBeenCalledOnce();
  });

  test("leaves a click on a video to the video", () => {
    const { listeners, onClose } = setup();

    listeners.onClick(clickOn(document.createElement("video")));
    expect(onClose).not.toHaveBeenCalled();
  });

  test("reports a Ctrl or Meta click instead of closing, even on a video", () => {
    const { listeners, onClose, onCtrlClick } = setup();
    const ctrlClick = clickOn(document.createElement("img"), { ctrlKey: true });

    listeners.onClick(ctrlClick);
    listeners.onClick(clickOn(document.createElement("video"), { metaKey: true }));
    expect([onCtrlClick.mock.calls.length, ctrlClick.defaultPrevented, onClose.mock.calls.length]).toEqual([2, true, 0]);
  });

  test("closes on a right click instead of opening the context menu", () => {
    const { listeners, onClose } = setup();
    const contextMenu = new MouseEvent("contextmenu", { cancelable: true });

    listeners.onContextmenu(contextMenu);
    expect([contextMenu.defaultPrevented, onClose.mock.calls.length]).toEqual([true, 1]);
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
    const { listeners, onShowNext, onShowPrevious } = setup();
    const down = new WheelEvent("wheel", { deltaY: 100, cancelable: true });

    listeners.onWheel(down);
    listeners.onWheel(new WheelEvent("wheel", { deltaY: -100 }));
    expect([down.defaultPrevented, onShowNext.mock.calls.length, onShowPrevious.mock.calls.length]).toEqual([true, 1, 1]);
  });

  test("leaves a ctrl wheel and a sideways wheel to the browser", () => {
    const { listeners, onShowNext, onShowPrevious } = setup();
    const zoom = new WheelEvent("wheel", { deltaY: 100, cancelable: true });

    // happy-dom's WheelEvent extends UIEvent, so it drops ctrlKey from its init.
    Object.defineProperty(zoom, "ctrlKey", { value: true });
    listeners.onWheel(zoom);
    listeners.onWheel(new WheelEvent("wheel", { deltaX: 100 }));
    expect([zoom.defaultPrevented, onShowNext.mock.calls.length, onShowPrevious.mock.calls.length]).toEqual([false, 0, 0]);
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
