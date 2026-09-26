import { GalleryFlow } from "@/features/gallery/flows/flow";
import { MediaItem } from "@/types/media";

export class GalleryOpenCloseFlow extends GalleryFlow {
  public open(item: MediaItem): void {
    this.disablePreview();
    this.model.open(item);
    this.view.open();
    this.flows.display.display(item);
    this.control.enableInteractionTracking();
    this.context.events.gallery.openedGallery.emit();
  }

  public close(): void {
    this.model.close();
    this.view.close();
    this.returnToLastViewed();
    this.control.disableInteractionTracking();
    this.context.domEvents.document.wheel.toggle(true);
    this.context.events.gallery.closedGallery.emit();
  }

  public reOpen(): void {
    this.open(this.model.currentItem());
  }

  private returnToLastViewed(): void {
    if (this.usingColumnLayout()) {
      this.view.scrollToThumbAfterLoad(this.model.currentItem().id);
    }
  }

  private disablePreview(): void {
    if (this.context.preferences.gallery.previewEnabled.value) {
      this.context.preferences.gallery.previewEnabled.set(false);
    }
  }
}
