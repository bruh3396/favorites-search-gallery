import { GALLERY_ENABLED } from "../../../../../lib/globals/flags";
import { addGalleryEventListeners } from "../../events/gallery_event_listeners";
import { insertGalleryContainer } from "../../../view/ui/gallery_container";
import { setupGalleryView } from "../../../view/gallery_view";
import { setupVisibleThumbObserver } from "../../events/gallery_visible_thumb_observer";

export function setupGallery(): void {
  if (GALLERY_ENABLED) {
    insertGalleryContainer();
    setupGalleryEvents();
    setupGalleryView();
    addGalleryEventListeners();
  }
}

function setupGalleryEvents() : void {
  setupVisibleThumbObserver();
}
