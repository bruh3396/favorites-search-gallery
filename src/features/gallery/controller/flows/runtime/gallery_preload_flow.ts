import * as GalleryModel from "../../../model/gallery_model";
import * as GalleryThumbObserver from "../../events/desktop/gallery_visible_thumb_observer";
import * as GalleryView from "../../../view/gallery_view";
import { DO_NOTHING } from "../../../../../utils/misc/async";
import { GallerySettings } from "../../../../../config/gallery_settings";
import { PerformanceProfile } from "../../../../../types/common_types";
import { Preferences } from "../../../../../lib/global/preferences/preferences";

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

export const preloadContentInGalleryAround = GallerySettings.preloadingEnabled ? preloadContentInGalleryAroundHelper : DO_NOTHING;
export const preloadAllVisibleContent = (GallerySettings.preloadingEnabled || Preferences.performanceProfile.value !== PerformanceProfile.NORMAL) ? preloadAllVisibleContentHelper : DO_NOTHING;

export function preloadContentOutsideGalleryAround(thumb: HTMLElement): void {
  GalleryThumbObserver.setCenterThumb(thumb);
  preloadAllVisibleContent();
}
