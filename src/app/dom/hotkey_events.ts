import { DomEvents } from "@/app/dom/events";
import { Events } from "@/app/channels/events";
import { galleryOpened } from "@/app/channels/feature_bridge";

export function setupHotkeyEvents(): void {
  DomEvents.document.keydown.on((event) => {
    if (!event.isHotkey || galleryOpened()) {
      return;
    }
    Events.app.hotkeyPressed.emit(event.key.toLowerCase());
  });
}
