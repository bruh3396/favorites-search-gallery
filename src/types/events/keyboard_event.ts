import { isHotkeyEvent } from "../../utils/dom/dom";

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
