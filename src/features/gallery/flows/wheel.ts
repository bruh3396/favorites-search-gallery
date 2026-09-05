import * as GalleryFlows from "@/features/gallery/flows/flows";
import { EnhancedWheelEvent } from "@/lib/input";

export function handleWheel(wheelEvent: EnhancedWheelEvent): void {
  GalleryFlows.Dispatch.run(
    {
      preview: (event) => GalleryFlows.Background.updateBackgroundOpacity(event.originalEvent),
      open: (event) => {
        if (!event.originalEvent.shiftKey && !event.originalEvent.ctrlKey) {
          GalleryFlows.Navigation.navigate(event.direction);
        }
      }
    },
    wheelEvent
  );
}
