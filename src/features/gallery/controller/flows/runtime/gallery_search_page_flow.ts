// import * as GalleryModel from "../../../model/gallery_model";
import * as GalleryView from "../../../view/gallery_view";
import { GallerySettings } from "../../../../../config/gallery_settings";
import { POSTS_PER_SEARCH_PAGE } from "../../../../../lib/global/constants";
import { executeFunctionBasedOnGalleryState } from "./gallery_runtime_flow_utils";
import { getAllThumbs } from "../../../../../utils/dom/dom";

export function onUpscaleToggled(value: boolean): void {
  if (value) {
    const thumbs = getAllThumbs();
    const notUsingInfiniteScroll = thumbs.length <= POSTS_PER_SEARCH_PAGE;

    if (notUsingInfiniteScroll) {
      GalleryView.preloadContentOutOfGallery(thumbs);
    } else {
      GalleryView.upscaleCachedImageThumbs();
    }
  } else {
    GalleryView.downscaleAll();
  }
}

export function onSearchPageCreated(): void {
  executeFunctionBasedOnGalleryState({
      idle: () => {
        if (GallerySettings.preloadOutsideGalleryOnSearchPage) {
          GalleryView.preloadContentOutOfGallery(getAllThumbs());
        }
      }
    });
}
