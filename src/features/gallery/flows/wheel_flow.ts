import * as GalleryBackgroundFlow from "@/features/gallery/flows/background_flow";
import * as GalleryDispatch from "@/features/gallery/flows/dispatch";
import * as GalleryNavigationFlow from "@/features/gallery/flows/navigation_flow";
import { EnhancedWheelEvent } from "@/lib/input";

export function handleWheel(wheelEvent: EnhancedWheelEvent): void {
  GalleryDispatch.run(
    {
      preview: (event) => GalleryBackgroundFlow.updateBackgroundOpacity(event.originalEvent),
      open: (event) => {
        if (!event.originalEvent.shiftKey && !event.originalEvent.ctrlKey) {
          GalleryNavigationFlow.navigate(event.direction);
        }
      }
    },
    wheelEvent
  );
}
