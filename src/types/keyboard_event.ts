import {isHotkeyEvent} from "../utils/dom/dom";

export default class FavoritesKeyboardEvent {
  private readonly key;
  private readonly originalEvent;
  private readonly isHotkey: boolean;

  constructor(event: KeyboardEvent) {
    this.originalEvent = event;
    this.key = event.key.toLowerCase();
    this.isHotkey = isHotkeyEvent(event);
  }
}
