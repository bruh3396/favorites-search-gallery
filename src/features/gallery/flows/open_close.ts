import { GalleryFlow } from "@/features/gallery/flows/flow";

export class GalleryOpenCloseFlow extends GalleryFlow {
  public open(thumb: HTMLElement): void {
    this.disablePreview();
    this.model.open(thumb);
    this.view.open(thumb);
    this.flows.display.display(thumb);
    this.control.enableInteractionTracking();
    this.context.events.gallery.openedGallery.emit(thumb);
  }

  public close(): void {
    this.model.close();
    this.view.close();
    this.control.disableInteractionTracking();
    this.context.domEvents.document.wheel.toggle(true);
    this.context.events.gallery.closedGallery.emit();
  }

  public reOpen(): void {
    this.open(this.model.currentThumb());
  }

  private disablePreview(): void {
    if (this.context.preferences.gallery.previewEnabled.value) {
      this.context.preferences.gallery.previewEnabled.set(false);
    }
  }
}
