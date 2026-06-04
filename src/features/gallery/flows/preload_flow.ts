import * as GalleryModel from "@/features/gallery/model/gallery_model";
import * as GalleryThumbObserver from "@/features/gallery/control/visible_thumb_observer";
import * as GalleryView from "@/features/gallery/view/gallery_view";
import { GalleryConfig } from "@/config/gallery_config";
import { yieldControl } from "@/lib/async/timing";

export async function preloadVisibleThumbs(): Promise<void> {
  if (!GalleryConfig.preloadingEnabled || GalleryModel.hasRecentlyExitedGallery() || GalleryModel.isInGallery()) {
    return;
  }
  const thumbs = GalleryThumbObserver.getVisibleThumbs();

  if (thumbs.length > 0 && thumbs.length < GalleryConfig.maxVisibleThumbsBeforeStoppingPreload) {
    await yieldControl();
    GalleryView.preloadImages(thumbs);
  }
}

export function preloadVisibleThumbsAround(thumb: HTMLElement): void {
  GalleryThumbObserver.setCenterThumb(thumb);
  preloadVisibleThumbs();
}

export async function preloadInGalleryAround(thumb: HTMLElement): Promise<void> {
  if (GalleryConfig.preloadingEnabled) {
    await yieldControl();
    GalleryView.preload(GalleryModel.getThumbsAround(thumb));
  }
}
