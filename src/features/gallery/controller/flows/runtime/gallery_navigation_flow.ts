import * as GalleryAutoplayController from "../../../autoplay/gallery_autoplay_controller";
import * as GalleryModel from "../../../model/gallery_model";
import * as GalleryPreloadFlow from "./gallery_preload_flow";
import * as GalleryView from "../../../view/gallery_view";
import { CrossFeatureRequests } from "../../../../../lib/events/cross_feature_requests";
import { GalleryBoundary } from "../../../types/gallery_types";
import { NavigationKey } from "../../../../../types/common_types";
import { ON_FAVORITES_PAGE } from "../../../../../lib/environment/environment";
import { usingInfiniteScroll } from "../../../../../lib/preferences/infinite_scroll";

export function navigate(direction: NavigationKey): void {
  switch (GalleryModel.navigate(direction)) {
    case GalleryBoundary.AT_LEFT_BOUNDARY:
      navigateAtLeftBoundary();
      break;

    case GalleryBoundary.AT_RIGHT_BOUNDARY:
      navigateAtRightBoundary();
      break;

    default:
      finishNavigation();
      break;
  }
}

function navigateAtLeftBoundary(): void {
  if (!usingInfiniteScroll() && loadMoreResults("ArrowLeft")) {
    GalleryModel.navigateToPreviousPage();
    finishNavigation();
  }
}

function navigateAtRightBoundary(): void {
  if (!loadMoreResults("ArrowRight")) {
    return;
  }

  if (usingInfiniteScroll()) {
    GalleryModel.navigate("ArrowRight");
  } else {
    GalleryModel.navigateToNextPage();
  }
  finishNavigation();
}

function loadMoreResults(direction: NavigationKey): boolean {
  if (ON_FAVORITES_PAGE) {
    return CrossFeatureRequests.loadNewFavoritesInGallery.request(direction);
  }
  return (CrossFeatureRequests.loadNewSearchPagesInGallery.request(direction)) !== null;
}

function finishNavigation(): void {
  const thumb = GalleryModel.getCurrentThumb();

  GalleryView.showContentInGallery(thumb);
  GalleryAutoplayController.startViewTimer(thumb);
  GalleryPreloadFlow.preloadContentInGalleryAround(thumb);
}
