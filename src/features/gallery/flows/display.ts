import { GalleryConfig } from "@/config/gallery_config";
import { GalleryFlow } from "@/features/gallery/flows/flow";
import { MediaItem } from "@/types/media";
import { queueMacroTask } from "@/lib/async/scheduling";

export class GalleryDisplayFlow extends GalleryFlow {
  public displaySelected(): void {
    this.display(this.model.currentItem());
  }

  public display(item: MediaItem): void {
    this.view.display(item);
    this.followInContent(item);
    this.context.events.gallery.displayedItem.emit(item);
    this.cacheAdjacent(item);
  }

  private followInContent(item: MediaItem): void {
    if (!this.usingColumnLayout() && !this.context.environment.usingFirefox) {
      this.view.scrollToThumb(item.id);
    }
  }

  private cacheAdjacent(item: MediaItem): void {
    if (GalleryConfig.preloadingEnabled) {
      queueMacroTask(() => {
        this.view.cache(this.model.getItemsAround(item.id));
      });
    }
  }
}
