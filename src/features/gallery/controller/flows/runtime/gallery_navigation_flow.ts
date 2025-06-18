import * as GalleryAutoplayController from "../../../autoplay/gallery_autoplay_controller";
import * as GalleryFavoritesFlow from "./gallery_favorites_flow";
import * as GalleryModel from "../../../model/gallery_model";
import * as GalleryPreloadFlow from "./gallery_preload_flow";
import * as GalleryView from "../../../view/gallery_view";
import { Events } from "../../../../../lib/globals/events";
import { NavigationKey } from "../../../../../types/primitives/primitives";
import { ON_FAVORITES_PAGE } from "../../../../../lib/globals/flags";

function changeFavoritesPageInGallery(direction: NavigationKey): Promise<HTMLElement> {
  return new Promise((resolve, reject) => {
    const onPageChangeInGallery = (): void => {
      const thumb = GalleryModel.navigateAfterPageChange(direction);

      if (thumb === undefined) {
        reject(new Error("Could not find favorite after changing  page"));
      } else {
        resolve(thumb);
      }
    };

    Events.favorites.pageChangeResponse.timeout(50)
      .then(onPageChangeInGallery)
      .catch(onPageChangeInGallery);
    Events.gallery.requestPageChange.emit(direction);
  });
}

function changeSearchPageInGallery(direction: NavigationKey): void {
  const searchPage = GalleryModel.navigateSearchPages(direction);

  if (searchPage === null) {
    GalleryModel.clampCurrentIndex();
    return;
  }
  GalleryModel.preloadSearchPages();
  GalleryView.createSearchPage(searchPage);
  GalleryFavoritesFlow.handlePageChange();
  const thumb = GalleryModel.navigateAfterPageChange(direction);

  if (thumb === undefined) {
    console.error("Could not navigate in gallery");
  } else {
    completeNavigation(thumb);
  }
}

function completeNavigation(thumb: HTMLElement): void {
  GalleryView.showContentInGallery(thumb);
  GalleryAutoplayController.startViewTimer(thumb);
  GalleryPreloadFlow.preloadContentInGalleryAround(thumb);
}

export function navigate(direction: NavigationKey): void {
  const thumb = GalleryModel.navigate(direction);
  const thumbIsOnPage = thumb !== undefined;

  if (thumbIsOnPage) {
    completeNavigation(thumb);
    return;
  }

  if (ON_FAVORITES_PAGE) {
    changeFavoritesPageThenNavigate(direction);
    return;
  }
  changeSearchPageInGallery(direction);
}

export async function changeFavoritesPageThenNavigate(direction: NavigationKey): Promise<void> {
  completeNavigation(await changeFavoritesPageInGallery(direction));
}
