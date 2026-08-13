import { getThumbUnderCursor, insideOfThumb } from "@/lib/thumb/thumbs";
import { ClickCode } from "@/types/input";

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
