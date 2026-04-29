// import * as GalleryModel from "../../../model/gallery_model";
import * as GalleryModel from "../../../model/gallery_model";
import * as GalleryThumbObserver from "../../events/desktop/gallery_visible_thumb_observer";
import * as GalleryView from "../../../view/gallery_view";
import { DO_NOTHING, POSTS_PER_SEARCH_PAGE } from "../../../../../lib/environment/constants";
import { GallerySettings } from "../../../../../config/gallery_settings";
import { executeFunctionBasedOnGalleryState } from "./gallery_runtime_flow_utils";
import { getAllContentThumbs } from "../../../../../lib/dom/content_thumb";

export function onUpscaleToggled(value: boolean): void {
  if (value) {
    const thumbs = getAllContentThumbs();
    const notUsingInfiniteScroll = thumbs.length <= POSTS_PER_SEARCH_PAGE;

    if (notUsingInfiniteScroll) {
      GalleryView.preloadContentOutOfGallery(thumbs);
    }
    GalleryView.upscaleCachedImageThumbs();
  } else {
    GalleryView.downscaleAll();
  }
}

const preloadOutsideGallery = GallerySettings.preloadOutsideGalleryOnSearchPage ? (): void => {
  GalleryView.preloadContentOutOfGallery(getAllContentThumbs());
} : DO_NOTHING;

export function onSearchPageCreated(): void {
  executeFunctionBasedOnGalleryState({
    idle: preloadOutsideGallery
  });
}

export function handleResultsAddedToSearchPage(thumbs: HTMLElement[]): void {
  GalleryModel.indexCurrentPageThumbs();
  GalleryThumbObserver.observe(thumbs);
}
