import * as GalleryModel from "../../../model/gallery_model";
import * as GalleryThumbObserver from "../../events/gallery_visible_thumb_observer";
import * as GalleryView from "../../../view/gallery_view";
import { Events } from "../../../../../lib/globals/events";
import { executeFunctionBasedOnGalleryState } from "./gallery_runtime_flow_utils";

export function handlePageChange(): void {
  GalleryThumbObserver.resetCenterThumb();
  GalleryThumbObserver.observeAllThumbsOnPage();
  GalleryModel.indexCurrentPageThumbs();
  executeFunctionBasedOnGalleryState({
    idle: GalleryView.handlePageChange,
    hover: GalleryView.handlePageChange,
    gallery: GalleryView.handlePageChangeInGallery
  });
}

export function handleResultsAddedToCurrentPage(results: HTMLElement[]): void {
  GalleryThumbObserver.observe(results);
  GalleryModel.indexCurrentPageThumbs();
  GalleryView.handleResultsAddedToCurrentPage(results);
}

export function handleNewFavoritesFoundOnReload(): void {
  GalleryThumbObserver.observeAllThumbsOnPage();
  GalleryModel.indexCurrentPageThumbs();
}

export function inGalleryResponse(): void {
  Events.gallery.inGalleryResponse.emit(GalleryModel.inGallery());
}
