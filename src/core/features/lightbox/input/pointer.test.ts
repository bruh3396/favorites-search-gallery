import { LightboxPointer, LightboxPointerDependencies, LightboxPointerListeners } from "@/core/features/lightbox/input/pointer";
import { Mock, describe, expect, test, vi } from "vitest";
import { Signal } from "@/core/utils/reactive/signal";
import { ZoomPoint } from "@/core/features/lightbox/zoom/zoom";

type Commands = LightboxPointerDependencies["commands"];
type FakeCommands = { [Name in keyof Commands]: Mock<Commands[Name]> };

interface Setup {
  pointer: LightboxPointer;
  listeners: LightboxPointerListeners;
  commands: FakeCommands;
  isZoomed: Signal<boolean>;
  show: Mock<() => void>;
  hideSoon: Mock<() => void>;
}

function locatePoint(event: MouseEvent): ZoomPoint {
  return { x: event.clientX - 100, y: event.clientY };
}

function setup(): Setup {
  const commands: FakeCommands = {
    showNext: vi.fn(), showPrevious: vi.fn(), close: vi.fn(), toggleZoom: vi.fn(), zoomBy: vi.fn(), zoomOut: vi.fn(),
    panBy: vi.fn(), openOriginal: vi.fn(), openPostPage: vi.fn()
  };
  const isZoomed = new Signal(false);
  const show = vi.fn<() => void>();
  const hideSoon = vi.fn<() => void>();
  const pointer = new LightboxPointer({ commands, isZoomed, visibility: { show, hideSoon }, locatePoint });
  return { pointer, listeners: pointer.listeners, commands, isZoomed, show, hideSoon };
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

function ctrlWheel(deltaY: number, clientX = 0): WheelEvent {
  const event = new WheelEvent("wheel", { deltaY, cancelable: true });

  Object.defineProperties(event, { ctrlKey: { value: true }, clientX: { value: clientX }, clientY: { value: 0 } });
  return event;
}

describe("LightboxPointer", () => {
  test("closes on a plain click", () => {
    const { listeners, commands } = setup();

    listeners.onClick(clickOn(document.createElement("img")));
    expect(commands.close).toHaveBeenCalledOnce();
  });

  test("leaves a click on a video to the video", () => {
    const { listeners, commands } = setup();

    listeners.onClick(clickOn(document.createElement("video")));
    expect(commands.close).not.toHaveBeenCalled();
  });

  test("zooms at the clicked point on a Shift click instead of closing", () => {
    const { listeners, commands } = setup();

    listeners.onClick(clickOn(document.createElement("img"), { shiftKey: true, clientX: 150, clientY: 60 }));
    expect([commands.toggleZoom.mock.calls, commands.close.mock.calls.length]).toEqual([[[{ x: 50, y: 60 }]], 0]);
  });

  test("zooms out on a click while zoomed instead of closing", () => {
    const { listeners, commands, isZoomed } = setup();

    isZoomed.value = true;
    listeners.onClick(clickOn(document.createElement("img")));
    expect([commands.zoomOut.mock.calls.length, commands.close.mock.calls.length]).toEqual([1, 0]);
  });

  test("opens the original on a Ctrl or Meta click instead of closing, even on a video", () => {
    const { listeners, commands } = setup();
    const ctrlClick = clickOn(document.createElement("img"), { ctrlKey: true });

    listeners.onClick(ctrlClick);
    listeners.onClick(clickOn(document.createElement("video"), { metaKey: true }));
    expect([commands.openOriginal.mock.calls.length, ctrlClick.defaultPrevented, commands.close.mock.calls.length]).toEqual([2, true, 0]);
  });

  test("closes on a right click instead of opening the context menu", () => {
    const { listeners, commands } = setup();
    const contextMenu = new MouseEvent("contextmenu", { cancelable: true });

    listeners.onContextmenu(contextMenu);
    expect([contextMenu.defaultPrevented, commands.close.mock.calls.length]).toEqual([true, 1]);
  });

  test("opens the post page on a middle click and ignores other auxiliary clicks", () => {
    const { listeners, commands } = setup();
    const middleClick = new MouseEvent("auxclick", { cancelable: true, button: 1 });

    listeners.onAuxclick(middleClick);
    listeners.onAuxclick(new MouseEvent("auxclick", { button: 2 }));
    expect([commands.openPostPage.mock.calls.length, middleClick.defaultPrevented]).toEqual([1, true]);
  });

  test("prevents autoscroll on a middle press and leaves other presses alone", () => {
    const { listeners } = setup();
    const middle = new MouseEvent("mousedown", { cancelable: true, button: 1 });
    const left = new MouseEvent("mousedown", { cancelable: true, button: 0 });

    listeners.onMousedown(middle);
    listeners.onMousedown(left);
    expect([middle.defaultPrevented, left.defaultPrevented]).toEqual([true, false]);
  });

  test("keeps the browser from dragging the image away", () => {
    const { listeners } = setup();
    const dragStart = new Event("dragstart", { cancelable: true }) as DragEvent;

    listeners.onDragstart(dragStart);
    expect(dragStart.defaultPrevented).toBe(true);
  });

  test("pans by each move of a drag while zoomed", () => {
    const { listeners, commands, isZoomed } = setup();

    isZoomed.value = true;
    drag(listeners, [[0, 0], [10, 0], [15, -5]]);
    expect(commands.panBy.mock.calls).toEqual([[10, 0], [5, -5]]);
  });

  test("ignores the click that ends a drag, and only that one", () => {
    const { listeners, commands } = setup();

    drag(listeners, [[0, 0], [10, 0]]);
    listeners.onClick(clickOn(document.createElement("img")));
    listeners.onClick(clickOn(document.createElement("img")));
    expect(commands.close).toHaveBeenCalledOnce();
  });

  test("keeps the pointer through a drag while zoomed", () => {
    const { listeners, isZoomed } = setup();
    const target = document.createElement("div");
    const setPointerCapture = vi.fn<(pointerId: number) => void>();

    isZoomed.value = true;
    target.setPointerCapture = setPointerCapture;
    target.addEventListener("pointermove", event => listeners.onPointermove(event));
    listeners.onPointerdown(new PointerEvent("pointerdown", { button: 0 }));
    target.dispatchEvent(new PointerEvent("pointermove", { pointerType: "mouse", pointerId: 7, clientX: 10 }));
    expect(setPointerCapture.mock.calls).toEqual([[7]]);
  });

  test("stops a drag the browser cancels or the lightbox stops", () => {
    const { pointer, listeners, commands, isZoomed } = setup();

    isZoomed.value = true;
    listeners.onPointerdown(new PointerEvent("pointerdown", { button: 0 }));
    listeners.onPointercancel();
    listeners.onPointermove(movePointer({ clientX: 10 }));
    listeners.onPointerdown(new PointerEvent("pointerdown", { button: 0 }));
    pointer.stop();
    listeners.onPointermove(movePointer({ clientX: 20 }));
    expect(commands.panBy).not.toHaveBeenCalled();
  });

  test("never drags with another button", () => {
    const { listeners, commands } = setup();

    listeners.onPointerdown(new PointerEvent("pointerdown", { button: 2 }));
    listeners.onPointermove(movePointer({ clientX: 10 }));
    listeners.onPointerup();
    listeners.onClick(clickOn(document.createElement("img")));
    expect(commands.close).toHaveBeenCalledOnce();
  });

  test("treats a press that barely moves as a click", () => {
    const { listeners, commands } = setup();

    drag(listeners, [[0, 0], [3, 0]]);
    listeners.onClick(clickOn(document.createElement("img")));
    expect([commands.close.mock.calls.length, commands.panBy.mock.calls.length]).toEqual([1, 0]);
  });

  test("asks for the next item on a wheel down and the previous one on a wheel up", () => {
    const { listeners, commands } = setup();
    const down = new WheelEvent("wheel", { deltaY: 100, cancelable: true });

    listeners.onWheel(down);
    listeners.onWheel(new WheelEvent("wheel", { deltaY: -100 }));
    expect([down.defaultPrevented, commands.showNext.mock.calls.length, commands.showPrevious.mock.calls.length]).toEqual([true, 1, 1]);
  });

  test("leaves a sideways wheel to the browser while fitted", () => {
    const { listeners, commands } = setup();
    const sideways = new WheelEvent("wheel", { deltaX: 100, cancelable: true });

    listeners.onWheel(sideways);
    expect([sideways.defaultPrevented, commands.showNext.mock.calls.length, commands.showPrevious.mock.calls.length]).toEqual([false, 0, 0]);
  });

  test("zooms at the pointer on a Ctrl wheel, in on up and back out by as much on down, instead of stepping", () => {
    const { listeners, commands } = setup();
    const up = ctrlWheel(-100, 300);

    listeners.onWheel(up);
    listeners.onWheel(ctrlWheel(100));
    const [[inFactor, point], [outFactor]] = commands.zoomBy.mock.calls;

    expect(inFactor * outFactor).toBeCloseTo(1);
    expect([inFactor > 1, point, up.defaultPrevented, commands.showNext.mock.calls.length]).toEqual([true, { x: 200, y: 0 }, true, 0]);
  });

  test("pans with the wheel while zoomed instead of stepping", () => {
    const { listeners, commands, isZoomed } = setup();
    const wheel = new WheelEvent("wheel", { deltaX: 20, deltaY: 100, cancelable: true });

    isZoomed.value = true;
    listeners.onWheel(wheel);
    expect([commands.panBy.mock.calls, wheel.defaultPrevented, commands.showNext.mock.calls.length]).toEqual([[[-20, -100]], true, 0]);
  });

  describe("lastPoint", () => {
    test("follows the mouse in stage coordinates, ignoring touch", () => {
      const { pointer, listeners } = setup();
      const points = [pointer.lastPoint.value];

      listeners.onPointermove(movePointer({ clientX: 150, clientY: 40 }));
      points.push(pointer.lastPoint.value);
      listeners.onPointermove(movePointer({ clientX: 500, clientY: 500, pointerType: "touch" }));
      points.push(pointer.lastPoint.value);
      expect(points).toEqual([undefined, { x: 50, y: 40 }, { x: 50, y: 40 }]);
    });

    test("forgets the pointer once it leaves or the lightbox opens again", () => {
      const { pointer, listeners } = setup();
      const points: (ZoomPoint | undefined)[] = [];

      listeners.onPointermove(movePointer({ clientX: 150 }));
      listeners.onPointerleave();
      points.push(pointer.lastPoint.value);
      listeners.onPointermove(movePointer({ clientX: 150 }));
      pointer.start();
      points.push(pointer.lastPoint.value);
      expect(points).toEqual([undefined, undefined]);
    });
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
