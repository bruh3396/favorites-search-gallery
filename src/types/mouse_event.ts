import {getThumbUnderCursor, insideOfThumb} from "../utils/dom/dom";
import {CLICK_CODES} from "../config/constants";

export default class FavoritesMouseEvent {
  public readonly originalEvent: MouseEvent;
  public readonly leftClick: boolean;
  public readonly rightClick: boolean;
  public readonly middleClick: boolean;
  public readonly ctrlKey: boolean;
  public readonly shiftKey: boolean;
  public readonly thumb: HTMLElement | null;
  public readonly insideOfThumb: boolean;

  constructor(event: MouseEvent) {
    this.originalEvent = event;
    this.leftClick = event.button === CLICK_CODES.left;
    this.rightClick = event.button === CLICK_CODES.right;
    this.middleClick = event.button === CLICK_CODES.middle;
    this.ctrlKey = event.ctrlKey;
    this.shiftKey = event.shiftKey;
    this.thumb = getThumbUnderCursor(event);
    this.insideOfThumb = this.thumb !== null || insideOfThumb(this.originalEvent.target);
  }
}
