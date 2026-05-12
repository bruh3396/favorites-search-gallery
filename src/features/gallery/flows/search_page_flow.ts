import * as GalleryModel from "../model/gallery_model";
import * as GalleryThumbObserver from "../control/visible_thumb_observer";
import * as GalleryView from "../view/gallery_view";
import { POSTS_PER_SEARCH_PAGE, doNothing } from "../../../lib/environment/constants";
import { GalleryConfig } from "../../../config/gallery_config";
import { dispatchByState } from "./state_dispatch";
import { getAllContentThumbs } from "../../../lib/dom/content_thumb";

export function onUpscaleToggled(value: boolean): void {
  if (value) {
    const thumbs = getAllContentThumbs();
    const notUsingInfiniteScroll = thumbs.length <= POSTS_PER_SEARCH_PAGE;

    if (notUsingInfiniteScroll) {
      GalleryView.preloadImages(thumbs);
    }
    GalleryView.upscaleCachedThumbs();
  } else {
    GalleryView.downscaleAll();
  }
}

const preloadOutsideGallery = GalleryConfig.preloadOutsideGalleryOnSearchPage ? (): void => {
  GalleryView.preloadImages(getAllContentThumbs());
} : doNothing;

export function onSearchPageCreated(): void {
  dispatchByState({
    idle: preloadOutsideGallery
  });
}

export function handleResultsAddedToSearchPage(thumbs: HTMLElement[]): void {
  GalleryModel.refreshThumbs();
  GalleryThumbObserver.observe(thumbs);
}
