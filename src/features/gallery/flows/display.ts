import * as GalleryModel from "@/features/gallery/model/model";
import * as GalleryView from "@/features/gallery/view/view";
import { Events } from "@/app/channels/events";
import { GalleryConfig } from "@/config/gallery_config";
import { queueMacroTask } from "@/lib/async/scheduling";

export function displaySelected(): void {
  display(GalleryModel.currentThumb());
}

export function display(thumb: HTMLElement): void {
  GalleryView.display(thumb);
  Events.gallery.displayedThumb.emit(thumb);
  cacheAdjacent(thumb);
}

function cacheAdjacent(thumb: HTMLElement): void {
  if (GalleryConfig.preloadingEnabled) {
    queueMacroTask(() => {
      GalleryView.cache(GalleryModel.getItemsAround(thumb.id));
    });
  }
}
