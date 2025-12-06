import * as GalleryModel from "../../../model/gallery_model";
import * as GalleryThumbObserver from "../../events/desktop/gallery_visible_thumb_observer";
import * as GalleryView from "../../../view/gallery_view";
import { executeFunctionBasedOnGalleryState } from "./gallery_runtime_flow_utils";

export function handlePageChange(): void {
  reIndexThumbs();
  executeFunctionBasedOnGalleryState({
    idle: GalleryView.handlePageChange,
    hover: GalleryView.handlePageChange,
    gallery: GalleryView.handlePageChangeInGallery
  });
}

export function reIndexThumbs(): void {
  GalleryThumbObserver.resetCenterThumb();
  GalleryThumbObserver.observeAllThumbsOnPage();
  GalleryModel.indexCurrentPageThumbs();
}
