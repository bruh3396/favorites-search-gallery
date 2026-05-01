import * as GalleryModel from "../model/gallery_model";
import * as GalleryThumbObserver from "../control/gallery_visible_thumb_observer";
import * as GalleryView from "../view/gallery_view";

export function handleFavoritesAddedToCurrentPage(results: HTMLElement[]): void {
  GalleryThumbObserver.observe(results);
  GalleryModel.indexCurrentPageThumbs();
  GalleryView.handleFavoritesAddedToCurrentPage(results);
}

export function handleNewFavoritesFound(): void {
  GalleryThumbObserver.observeAllThumbsOnPage();
  GalleryModel.indexCurrentPageThumbs();
}
