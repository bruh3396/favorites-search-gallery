import * as GalleryNavigationFlow from "./gallery_navigation_flow";
import * as GalleryView from "../view/gallery_view";
import { EnhancedWheelEvent } from "../../../lib/dom/input_types";
import { executeByGalleryState } from "./gallery_state_executor";

export function onWheel(wheelEvent: EnhancedWheelEvent): void {
  executeByGalleryState(
    {
      hover: (event) => GalleryView.updateBackgroundOpacity(event.originalEvent),
      gallery: (event) => {
        if (!event.originalEvent.shiftKey && !event.originalEvent.ctrlKey) {
          GalleryNavigationFlow.navigate(event.direction);
        }
      }
    },
    wheelEvent
  );
}
