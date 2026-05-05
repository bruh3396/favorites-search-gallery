import * as GalleryModel from "../model/model";
import * as GalleryThumbObserver from "../control/visible_thumb_observer";
import * as GalleryView from "../view/gallery_view";
import { executeByGalleryState } from "./state_executor";

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

export function handleNewContent(elements: HTMLElement[]): void {
  GalleryThumbObserver.observe(elements);
  GalleryModel.indexCurrentPageThumbs();
  GalleryView.presetCanvasDimensions(elements);
}
