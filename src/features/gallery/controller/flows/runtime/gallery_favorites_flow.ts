import * as GalleryModel from "../../../model/gallery_model";
import * as GalleryThumbObserver from "../../events/desktop/gallery_visible_thumb_observer";
import * as GalleryView from "../../../view/gallery_view";

export function handleFavoritesAddedToCurrentPage(results: HTMLElement[]): void {
  GalleryThumbObserver.observe(results);
  GalleryModel.indexCurrentPageThumbs();
  GalleryView.handleFavoritesAddedToCurrentPage(results);
}

export function handleNewFavoritesFoundOnReload(): void {
  GalleryThumbObserver.observeAllThumbsOnPage();
  GalleryModel.indexCurrentPageThumbs();
}
