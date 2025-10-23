// import * as GalleryModel from "../../../model/gallery_model";
import * as GalleryView from "../../../view/gallery_view";
import { GallerySettings } from "../../../../../config/gallery_settings";
import { executeFunctionBasedOnGalleryState } from "./gallery_runtime_flow_utils";
import { getAllThumbs } from "../../../../../utils/dom/dom";

export function onUpscaleToggled(value: boolean): void {
  if (value) {
    GalleryView.upscaleCachedImageThumbs();
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
