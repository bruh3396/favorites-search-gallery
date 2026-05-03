import * as GalleryView from "../view/gallery_view";
import { executeByGalleryState } from "./gallery_state_executor";

export function onInteractionStopped(): void {
  executeByGalleryState({ gallery: () => GalleryView.toggleCursor(false) });
}
