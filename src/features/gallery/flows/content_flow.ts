import * as GalleryModel from "@/features/gallery/model/gallery_model";
import * as GalleryThumbObserver from "@/features/gallery/control/visible_thumb_observer";
import * as GalleryView from "@/features/gallery/view/gallery_view";
import { dispatchByState } from "@/features/gallery/flows/state_dispatch";

export function handlePageChange(): void {
  indexThumbs();
  dispatchByState({
    idle: GalleryView.reset,
    preview: GalleryView.reset,
    open: GalleryView.softReset
  });
}

export function indexThumbs(): void {
  GalleryThumbObserver.resetCenterThumb();
  GalleryThumbObserver.observeAllThumbsOnPage();
  GalleryModel.reIndexThumbs();
}

export function handleNewContent(elements: HTMLElement[]): void {
  GalleryThumbObserver.observe(elements);
  GalleryModel.reIndexThumbs();
}
