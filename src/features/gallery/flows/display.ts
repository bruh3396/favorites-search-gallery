import { GalleryConfig } from "@/config/gallery_config";
import { GalleryFlow } from "@/features/gallery/flows/flow";
import { queueMacroTask } from "@/lib/async/scheduling";

export class GalleryDisplayFlow extends GalleryFlow {
  public displaySelected(): void {
    this.display(this.model.currentThumb());
  }

  public display(thumb: HTMLElement): void {
    this.view.display(thumb);
    this.context.events.gallery.displayedThumb.emit(thumb);
    this.cacheAdjacent(thumb);
  }

  private cacheAdjacent(thumb: HTMLElement): void {
    if (GalleryConfig.preloadingEnabled) {
      queueMacroTask(() => {
        this.view.cache(this.model.getItemsAround(thumb.id));
      });
    }
  }
}
