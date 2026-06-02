/* eslint-disable max-classes-per-file */
import { getThumbUnderCursor, insideOfThumb } from "../lib/thumb/thumbs";
import { isHotkeyEvent } from "../utils/dom/interaction";

export type BackwardNavigationKey = "a" | "A" | "ArrowLeft"
export type ForwardNavigationKey = "d" | "D" | "ArrowRight"
export type NavigationKey = BackwardNavigationKey | ForwardNavigationKey
export type ExitKey = "Escape" | "Delete" | "Backspace"

export enum ClickCode {
  Left = 0,
  Middle = 1,
  Right = 2
}

export class EnhancedKeyboardEvent {
  public readonly key;
  public readonly originalEvent;
  public readonly isHotkey: boolean;

  constructor(event: KeyboardEvent) {
    this.originalEvent = event;
    this.key = event.key.toLowerCase();
    this.isHotkey = isHotkeyEvent(event);
  }
}

export class EnhancedMouseEvent {
  public readonly originalEvent: MouseEvent;
  public readonly leftClick: boolean;
  public readonly rightClick: boolean;
  public readonly middleClick: boolean;
  public readonly ctrlKey: boolean;
  public readonly shiftKey: boolean;
  public readonly thumb: HTMLElement | null;
  public readonly insideOfThumb: boolean;

  constructor(event: MouseEvent | TouchEvent) {
    if (!(event instanceof MouseEvent)) {
      event = convertTouchEventToMouseEvent(event, "mousedown");
    }
    this.originalEvent = event;
    this.leftClick = event.button === ClickCode.Left;
    this.rightClick = event.button === ClickCode.Right;
    this.middleClick = event.button === ClickCode.Middle;
    this.ctrlKey = event.ctrlKey;
    this.shiftKey = event.shiftKey;
    this.thumb = getThumbUnderCursor(event);
    this.insideOfThumb = this.thumb !== null || insideOfThumb(this.originalEvent.target);
  }
}

export class EnhancedWheelEvent {
  public readonly originalEvent: WheelEvent;
  public readonly direction: NavigationKey;

  constructor(event: WheelEvent) {
    this.originalEvent = event;
    this.direction = event.deltaY > 0 ? "ArrowRight" : "ArrowLeft";
  }
}

function convertTouchEventToMouseEvent(touchEvent: TouchEvent, type: string): MouseEvent {
  const touch = touchEvent.changedTouches[0];
  return new MouseEvent(type, {
    clientX: touch.clientX,
    clientY: touch.clientY,
    screenX: touch.screenX,
    screenY: touch.screenY,
    button: ClickCode.Left
  });
}
