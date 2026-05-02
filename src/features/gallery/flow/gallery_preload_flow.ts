import * as GalleryModel from "../model/gallery_model";
import * as GalleryThumbObserver from "../control/gallery_visible_thumb_observer";
import * as GalleryView from "../view/gallery_view";
import { GallerySettings } from "../../../config/gallery_settings";
import { PERFORMANCE_PROFILE } from "../../../lib/environment/derived_environment";
import { PerformanceProfile } from "../../../types/ui";
import { doNothing } from "../../../lib/environment/constants";

function preloadAllVisibleContentHelper(): void {
  if (GalleryModel.hasRecentlyExitedGallery() || GalleryModel.inGallery()) {
    return;
  }
  const thumbs = GalleryThumbObserver.getVisibleThumbs();

  if (thumbs.length < GallerySettings.maxVisibleThumbsBeforeStoppingPreload && thumbs.length > 0) {
    GalleryView.preloadContentOutOfGallery(thumbs);
  }
}

function preloadContentInGalleryAroundHelper(thumb: HTMLElement): void {
  GalleryView.preloadContentInGallery(GalleryModel.getThumbsAround(thumb));
}

export const preloadContentInGalleryAround = GallerySettings.preloadingEnabled ? preloadContentInGalleryAroundHelper : doNothing;
export const preloadAllVisibleContent = (GallerySettings.preloadingEnabled || PERFORMANCE_PROFILE !== PerformanceProfile.NORMAL) ? preloadAllVisibleContentHelper : doNothing;

export function preloadContentOutsideGalleryAround(thumb: HTMLElement): void {
  GalleryThumbObserver.setCenterThumb(thumb);
  preloadAllVisibleContent();
}
