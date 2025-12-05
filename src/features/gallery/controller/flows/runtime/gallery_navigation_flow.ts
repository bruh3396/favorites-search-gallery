import * as GalleryAutoplayController from "../../../autoplay/gallery_autoplay_controller";
import * as GalleryFavoritesFlow from "./gallery_favorites_flow";
import * as GalleryModel from "../../../model/gallery_model";
import * as GalleryPreloadFlow from "./gallery_preload_flow";
import * as GalleryView from "../../../view/gallery_view";
import { CrossFeatureRequests } from "../../../../../utils/cross_feature/cross_feature_requests";
import { NavigationKey } from "../../../../../types/common_types";
import { ON_FAVORITES_PAGE } from "../../../../../lib/global/flags/intrinsic_flags";

export function navigate(direction: NavigationKey): void {
  const thumb = GalleryModel.navigate(direction);
  const thumbIsOnPage = thumb !== undefined;

  if (thumbIsOnPage) {
    completeNavigation(thumb);
    return;
  }
  changePageThenNavigate(direction);
}

export function navigateRight(): void {
  navigate("ArrowRight");
}

export function navigateLeft(): void {
  navigate("ArrowLeft");
}

function completeNavigation(thumb: HTMLElement): void {
  GalleryView.showContentInGallery(thumb);
  GalleryAutoplayController.startViewTimer(thumb);
  GalleryPreloadFlow.preloadContentInGalleryAround(thumb);
}

function changePageThenNavigate(direction: NavigationKey): void {
  if (ON_FAVORITES_PAGE) {
    loadFavoritesThenNavigate(direction);
    return;
  }
  loadSearchPageThenNavigate(direction);
}

async function loadSearchPageThenNavigate(direction: NavigationKey): Promise<void> {
  const searchPage = await CrossFeatureRequests.loadNewSearchPagesInGallery.request(direction);
  const usingInfiniteScroll = await CrossFeatureRequests.infiniteScroll.request();

  if (!usingInfiniteScroll && searchPage === null) {
    GalleryModel.clampCurrentIndex();
    return;
  }

  if (usingInfiniteScroll) {
    GalleryFavoritesFlow.reIndexThumbs();
  } else {
    GalleryFavoritesFlow.handlePageChange();
  }
  const thumb = usingInfiniteScroll ? GalleryModel.navigateAfterAddingInfiniteScrollResults(direction) : GalleryModel.navigateAfterPageChange(direction);

  if (thumb === undefined) {
    console.error("Could not navigate in gallery");
  } else {
    completeNavigation(thumb);
  }
}

async function loadFavoritesThenNavigate(direction: NavigationKey): Promise<void> {
  const newFavoritesWereLoaded = await CrossFeatureRequests.loadNewFavoritesInGallery.request(direction);

  if (newFavoritesWereLoaded) {
    navigateAfterLoading(direction);
    return;
  }
  GalleryModel.clampCurrentIndex();
}

async function navigateAfterLoading(direction: NavigationKey): Promise<void> {
  const usingInfiniteScroll = await CrossFeatureRequests.infiniteScroll.request();
  let thumb;

  if (usingInfiniteScroll) {
    thumb = GalleryModel.navigateAfterAddingInfiniteScrollResults(direction);
  } else {
    thumb = GalleryModel.navigateAfterPageChange(direction);
  }

  if (thumb === undefined) {
    console.error("Could not find favorite after changing  page");
    return;
  }
  completeNavigation(thumb);
}
