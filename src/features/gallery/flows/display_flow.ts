import * as GalleryModel from "@/features/gallery/model/gallery_model";
import * as GalleryView from "@/features/gallery/view/gallery_view";
import { Events } from "@/app/channels/events";
import { GalleryConfig } from "@/config/gallery_config";
import { yieldControl } from "@/lib/async/timing";

export function display(thumb: HTMLElement): void {
  GalleryView.display(thumb);
  Events.gallery.displayedThumb.emit(thumb);
  cacheAdjacent(thumb);
}

export function displaySelected(): void {
  display(GalleryModel.currentThumb());
}

async function cacheAdjacent(thumb: HTMLElement): Promise<void> {
  if (GalleryConfig.preloadingEnabled) {
    await yieldControl();
    GalleryView.preload(GalleryModel.getThumbsAround(thumb));
  }
}
