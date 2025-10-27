import * as GalleryAutoplayController from "../../../autoplay/gallery_autoplay_controller";
import * as GalleryFavoritesFlow from "./gallery_favorites_flow";
import * as GalleryModel from "../../../model/gallery_model";
import * as GalleryPreloadFlow from "./gallery_preload_flow";
import * as GalleryView from "../../../view/gallery_view";
import { changeFavoritesPageInGallery, getAdjacentSearchPage } from "../../../../../utils/cross_feature/cross_feature_requests";
import { NavigationKey } from "../../../../../types/common_types";
import { ON_FAVORITES_PAGE } from "../../../../../lib/global/flags/intrinsic_flags";

async function changeSearchPageThenNavigate(direction: NavigationKey): Promise<void> {
  const searchPage = await getAdjacentSearchPage(direction);

  if (searchPage === null) {
    GalleryModel.clampCurrentIndex();
    return;
  }
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

export function navigateRight(): void {
  navigate("ArrowRight");
}

export function navigateLeft(): void {
  navigate("ArrowLeft");
}

export function navigate(direction: NavigationKey): void {
  const thumb = GalleryModel.navigate(direction);
  const thumbIsOnPage = thumb !== undefined;

  if (thumbIsOnPage) {
    completeNavigation(thumb);
    return;
  }
  changePageThenNavigate(direction);
}

function changePageThenNavigate(direction: NavigationKey): void {
  if (ON_FAVORITES_PAGE) {
    changeFavoritesPageThenNavigate(direction);
    return;
  }
  changeSearchPageThenNavigate(direction);
}

export async function changeFavoritesPageThenNavigate(direction: NavigationKey): Promise<void> {
  const usingPages = await changeFavoritesPageInGallery(direction);

  if (!usingPages) {
    GalleryModel.clampCurrentIndex();
    return;
  }
  const thumb = GalleryModel.navigateAfterPageChange(direction);

  if (thumb === undefined) {
    console.error("Could not find favorite after changing  page");
    return;
  }
  completeNavigation(thumb);
}
