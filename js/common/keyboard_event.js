class FavoritesKeyboardEvent {
  /** @type {String} */
  key;
  /** @type {KeyboardEvent} */
  originalEvent;
  /** @type {Boolean} */
  isHotkey;

  /**
   * @param {KeyboardEvent} keyboardEvent
   */
  constructor(keyboardEvent) {
    this.originalEvent = keyboardEvent;
    this.key = keyboardEvent.key.toLowerCase();
    this.isHotkey = Utils.isHotkeyEvent(keyboardEvent);
  }
}
