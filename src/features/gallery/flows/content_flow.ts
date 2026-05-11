import * as GalleryModel from "../model/gallery_model";
import * as GalleryThumbObserver from "../control/visible_thumb_observer";
import * as GalleryView from "../view/gallery_view";
import { dispatchByState } from "./state_dispatch";

export function handlePageChange(): void {
  indexThumbs();
  dispatchByState({
    idle: GalleryView.handlePageChange,
    hover: GalleryView.handlePageChange,
    open: GalleryView.handlePageChangeInGallery
  });
}

export function indexThumbs(): void {
  GalleryThumbObserver.resetCenterThumb();
  GalleryThumbObserver.observeAllThumbsOnPage();
  GalleryModel.refreshThumbs();
}

export function handleNewContent(elements: HTMLElement[]): void {
  GalleryThumbObserver.observe(elements);
  GalleryModel.refreshThumbs();
  GalleryView.presetCanvasDimensions(elements);
}
