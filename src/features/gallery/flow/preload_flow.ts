import * as GalleryModel from "../model/model";
import * as GalleryThumbObserver from "../control/visible_thumb_observer";
import * as GalleryView from "../view/gallery_view";
import { GalleryConfig } from "../../../config/gallery_config";

export function preloadVisibleThumbs(): void {
  if (!GalleryConfig.preloadingEnabled || GalleryModel.hasRecentlyExitedGallery() || GalleryModel.inGallery()) {
    return;
  }
  const thumbs = GalleryThumbObserver.getVisibleThumbs();

  if (thumbs.length > 0 && thumbs.length < GalleryConfig.maxVisibleThumbsBeforeStoppingPreload) {
    GalleryView.preloadContentOutOfGallery(thumbs);
  }
}

export function preloadAround(thumb: HTMLElement): void {
  GalleryThumbObserver.setCenterThumb(thumb);
  preloadVisibleThumbs();
}

export function preloadInGalleryAround(thumb: HTMLElement): void {
  if (GalleryConfig.preloadingEnabled) {
    GalleryView.preloadContentInGallery(GalleryModel.getThumbsAround(thumb));
  }
}
