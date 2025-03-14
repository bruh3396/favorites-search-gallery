class FavoritesMouseEvent {
  /** @type {MouseEvent} */
  originalEvent;
  /** @type {Boolean} */
  leftClick;
  /** @type {Boolean} */
  rightClick;
  /** @type {Boolean} */
  middleClick;
  /** @type {Boolean} */
  ctrlKey;
  /** @type {Boolean} */
  shiftKey;
  /** @type {HTMLElement | null} */
  thumb;
  /** @type {Boolean} */
  insideOfThumb;

  /**
   * @param {MouseEvent} mouseEvent
   */
  constructor(mouseEvent) {
    this.originalEvent = mouseEvent;
    this.leftClick = mouseEvent.button === Utils.clickCodes.left;
    this.rightClick = mouseEvent.button === Utils.clickCodes.right;
    this.middleClick = mouseEvent.button === Utils.clickCodes.middle;
    this.ctrlKey = mouseEvent.ctrlKey;
    this.shiftKey = mouseEvent.shiftKey;
    this.thumb = Utils.getThumbUnderCursor(mouseEvent);
    this.insideOfThumb = this.thumb !== null || Utils.insideOfThumb(this.originalEvent.target);
  }
}
