import { GalleryFlow } from "@/features/gallery/flows/flow";
import { throttle } from "@/lib/async/rate_limiting";

export class GalleryInteractionFlow extends GalleryFlow {
  public showCursorInGallery = throttle<MouseEvent>(() => {
    this.flows.dispatch.run({ open: () => this.view.showCursor() });
  }, 250);

  public handleMouseMove(event: MouseEvent): void {
    this.showCursorInGallery(event);
    this.view.revealMenu();
    this.flows.video.showControls(event);
  }

  public hideCursorInGallery(): void {
    this.flows.dispatch.run({ open: () => this.view.toggleCursor(false) });
  }
}
