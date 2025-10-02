/* eslint-disable max-classes-per-file */
import { ClickCode, NavigationKey } from "./common_types";
import { getThumbUnderCursor, insideOfThumb, isHotkeyEvent } from "../utils/dom/dom";
import { isForwardNavigationKey } from "./equivalence";

export class FavoritesKeyboardEvent {
  public readonly key;
  public readonly originalEvent;
  public readonly isHotkey: boolean;

  constructor(event: KeyboardEvent) {
    this.originalEvent = event;
    this.key = event.key.toLowerCase();
    this.isHotkey = isHotkeyEvent(event);
  }
}

function convertTouchEventToMouseEvent(touchEvent: TouchEvent, type: string): MouseEvent {
  const touch = touchEvent.changedTouches[0];
  return new MouseEvent(type, {
    clientX: touch.clientX,
    clientY: touch.clientY,
    screenX: touch.screenX,
    screenY: touch.screenY,
    button: ClickCode.LEFT
  });
}

export class FavoritesMouseEvent {
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
    this.leftClick = event.button === ClickCode.LEFT;
    this.rightClick = event.button === ClickCode.RIGHT;
    this.middleClick = event.button === ClickCode.MIDDLE;
    this.ctrlKey = event.ctrlKey;
    this.shiftKey = event.shiftKey;
    this.thumb = getThumbUnderCursor(event);
    this.insideOfThumb = this.thumb !== null || insideOfThumb(this.originalEvent.target);
  }
}

export class FavoritesWheelEvent {
  public readonly originalEvent: WheelEvent;
  public readonly direction: NavigationKey;

  constructor(event: WheelEvent) {
    this.originalEvent = event;
    this.direction = event.deltaY > 0 ? "ArrowRight" : "ArrowLeft";
  }

  public get isForward(): boolean {
    return isForwardNavigationKey(this.direction);
  }
}
