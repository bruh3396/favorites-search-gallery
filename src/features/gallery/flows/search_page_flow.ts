import * as GalleryModel from "../model/gallery_model";
import * as GalleryThumbObserver from "../control/visible_thumb_observer";
import * as GalleryView from "../view/gallery_view";
import { GalleryConfig } from "../../../config/gallery_config";
import { POSTS_PER_SEARCH_PAGE } from "../../../lib/environment/rule34_constants";
import { dispatchByState } from "./state_dispatch";
import { getAllContentThumbs } from "../../../app/layout/content_thumbs";

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

export function onSearchPageCreated(): void {
  dispatchByState({
    idle: preloadOutsideGallery
  });
}

export function handleResultsAddedToSearchPage(thumbs: HTMLElement[]): void {
  GalleryModel.reIndexThumbs();
  GalleryThumbObserver.observe(thumbs);
}

function preloadOutsideGallery(): void {
  if (GalleryConfig.preloadOutsideGalleryOnSearchPage) {
    GalleryView.preloadImages(getAllContentThumbs());
  }
}
