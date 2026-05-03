import * as GalleryModel from "../model/gallery_model";
import * as GalleryThumbObserver from "../control/gallery_visible_thumb_observer";
import * as GalleryView from "../view/gallery_view";
import { executeByGalleryState } from "./gallery_state_executor";

export function handlePageChange(): void {
  indexThumbs();
  executeByGalleryState({
    idle: GalleryView.handlePageChange,
    hover: GalleryView.handlePageChange,
    gallery: GalleryView.handlePageChangeInGallery
  });
}

export function indexThumbs(): void {
  GalleryThumbObserver.resetCenterThumb();
  GalleryThumbObserver.observeAllThumbsOnPage();
  GalleryModel.indexCurrentPageThumbs();
}
