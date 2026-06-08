import * as GalleryNavigationFlow from "@/features/gallery/flows/navigation_flow";
// import * as GalleryView from "@/features/gallery/view/gallery_view";
import { EnhancedWheelEvent } from "@/types/input";
import { dispatchByState } from "@/features/gallery/flows/state_dispatch";

export function onWheel(wheelEvent: EnhancedWheelEvent): void {
  dispatchByState(
    {
      // preview: (event) => GalleryView.updateBackgroundOpacity(event.originalEvent),
      open: (event) => {
        if (!event.originalEvent.shiftKey && !event.originalEvent.ctrlKey) {
          GalleryNavigationFlow.navigate(event.direction);
        }
      }
    },
    wheelEvent
  );
}
