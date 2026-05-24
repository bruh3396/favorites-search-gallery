import * as GalleryNavigationFlow from "./navigation_flow";
import * as GalleryView from "../view/gallery_view";
import { EnhancedWheelEvent } from "../../../types/input";
import { dispatchByState } from "./state_dispatch";

export function onWheel(wheelEvent: EnhancedWheelEvent): void {
  dispatchByState(
    {
      hover: (event) => GalleryView.updateBackgroundOpacity(event.originalEvent),
      open: (event) => {
        if (!event.originalEvent.shiftKey && !event.originalEvent.ctrlKey) {
          GalleryNavigationFlow.navigate(event.direction);
        }
      }
    },
    wheelEvent
  );
}
