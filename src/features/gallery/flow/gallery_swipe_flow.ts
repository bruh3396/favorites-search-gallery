import * as GalleryStateFlow from "./gallery_state_flow";
import { executeFunctionBasedOnGalleryState } from "./gallery_runtime_flow_utils";

export function onSwipeDown(): void {
  executeFunctionBasedOnGalleryState({
    gallery: GalleryStateFlow.exitGallery
  });
}
