import * as GalleryStateFlow from "./state_flow";
import { executeByGalleryState } from "./state_executor";

export function onSwipeDown(): void {
  executeByGalleryState({ gallery: GalleryStateFlow.exitGallery });
}
