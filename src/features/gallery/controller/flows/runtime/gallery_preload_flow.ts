import * as GalleryModel from "../../../model/gallery_model";
import * as GalleryThumbObserver from "../../events/desktop/gallery_visible_thumb_observer";
import * as GalleryView from "../../../view/gallery_view";
import { GallerySettings } from "../../../../../config/gallery_settings";
import { GalleryState } from "../../../types/gallery_types";
import { ON_FAVORITES_PAGE } from "../../../../../lib/global/flags/intrinsic_flags";

export function preloadContentInGalleryAround(thumb: HTMLElement | null): void {
  if (thumb !== null && GallerySettings.preloadingEnabled) {
    GalleryView.preloadContentInGallery(GalleryModel.getThumbsAround(thumb));
  }
}

export function preloadVisibleContentAround(thumb: HTMLElement | null): void {
  if (ON_FAVORITES_PAGE && !GalleryModel.hasRecentlyExitedGallery() && thumb !== null) {
    GalleryThumbObserver.setCenterThumb(thumb);
    preloadVisibleContent();
  }
}

export function canPreloadOutsideGallery(thumbs: HTMLElement[]): boolean {
  return GallerySettings.preloadingEnabled &&
    thumbs.length < GallerySettings.maxVisibleThumbsBeforeStoppingPreload &&
    thumbs.length > 0;
}

export function preloadVisibleContent(): void {
  if (GalleryModel.getCurrentState() === GalleryState.IN_GALLERY) {
    return;
  }
  const thumbs = GalleryThumbObserver.getVisibleThumbs();

  if (canPreloadOutsideGallery(thumbs)) {
    GalleryView.preloadContentOutOfGallery(thumbs);
  }
}
