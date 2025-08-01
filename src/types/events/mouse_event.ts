import { getThumbUnderCursor, insideOfThumb } from "../../utils/dom/dom";
import { ClickCodes } from "../primitives/enums";
import { convertTouchEventToMouseEvent } from "./event_utils";

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
    this.leftClick = event.button === ClickCodes.LEFT;
    this.rightClick = event.button === ClickCodes.RIGHT;
    this.middleClick = event.button === ClickCodes.MIDDLE;
    this.ctrlKey = event.ctrlKey;
    this.shiftKey = event.shiftKey;
    this.thumb = getThumbUnderCursor(event);
    this.insideOfThumb = this.thumb !== null || insideOfThumb(this.originalEvent.target);
  }
}
