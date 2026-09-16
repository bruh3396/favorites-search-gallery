import { EnhancedWheelEvent } from "@/lib/event/input";
import { GalleryFlow } from "@/features/gallery/flows/flow";

export class GalleryWheelFlow extends GalleryFlow {
  public handleWheel(wheelEvent: EnhancedWheelEvent): void {
    this.flows.dispatch.run(
      {
        preview: (event) => this.flows.background.updateBackgroundOpacity(event.originalEvent),
        open: (event) => {
          if (!event.originalEvent.shiftKey && !event.originalEvent.ctrlKey) {
            this.flows.navigation.navigate(event.direction);
          }
        }
      },
      wheelEvent
    );
  }
}
