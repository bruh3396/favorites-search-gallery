import * as GalleryStateFlow from "./gallery_state_flow";
import { executeByGalleryState } from "./gallery_state_executor";

export function onSwipeDown(): void {
  executeByGalleryState({ gallery: GalleryStateFlow.exitGallery });
}
