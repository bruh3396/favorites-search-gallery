import * as GalleryModel from "../model/model";
import * as GalleryThumbObserver from "../control/visible_thumb_observer";
import * as GalleryView from "../view/gallery_view";
import { GallerySettings } from "../../../config/gallery_settings";

export function preloadVisibleThumbs(): void {
  if (!GallerySettings.preloadingEnabled || GalleryModel.hasRecentlyExitedGallery() || GalleryModel.inGallery()) {
    return;
  }
  const thumbs = GalleryThumbObserver.getVisibleThumbs();

  if (thumbs.length > 0 && thumbs.length < GallerySettings.maxVisibleThumbsBeforeStoppingPreload) {
    GalleryView.preloadContentOutOfGallery(thumbs);
  }
}

export function preloadAround(thumb: HTMLElement): void {
  GalleryThumbObserver.setCenterThumb(thumb);
  preloadVisibleThumbs();
}

export function preloadInGalleryAround(thumb: HTMLElement): void {
  if (GallerySettings.preloadingEnabled) {
    GalleryView.preloadContentInGallery(GalleryModel.getThumbsAround(thumb));
  }
}
