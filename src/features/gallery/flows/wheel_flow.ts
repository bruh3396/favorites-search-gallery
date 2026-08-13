import * as GalleryDispatch from "@/features/gallery/flows/dispatch";
import * as GalleryNavigationFlow from "@/features/gallery/flows/navigation_flow";
import * as GalleryView from "@/features/gallery/view/gallery_view";
import { EnhancedWheelEvent } from "@/lib/input/wheel_event";

export function handleWheel(wheelEvent: EnhancedWheelEvent): void {
  GalleryDispatch.run(
    {
      preview: (event) => GalleryView.updateBackgroundOpacity(event.originalEvent),
      open: (event) => {
        if (!event.originalEvent.shiftKey && !event.originalEvent.ctrlKey) {
          GalleryNavigationFlow.navigate(event.direction);
        }
      }
    },
    wheelEvent
  );
}
