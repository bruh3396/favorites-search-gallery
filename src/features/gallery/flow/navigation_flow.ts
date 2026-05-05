import * as GalleryAutoplayController from "../features/autoplay/autoplay_controller";
import * as GalleryModel from "../model/model";
import * as GalleryPreloadFlow from "./preload_flow";
import * as GalleryView from "../view/gallery_view";
import { FeatureQueries } from "../../../lib/communication/feature_queries";
import { GalleryBoundary } from "../types/gallery_types";
import { NavigationKey } from "../../../types/input";
import { ON_FAVORITES_PAGE } from "../../../lib/environment/environment";
import { usingInfiniteScroll } from "../../../lib/preferences/infinite_scroll";

export function navigate(direction: NavigationKey): void {
  switch (GalleryModel.navigate(direction)) {
    case GalleryBoundary.AT_LEFT_BOUNDARY: navigateAtLeftBoundary();
      break;
    case GalleryBoundary.AT_RIGHT_BOUNDARY: navigateAtRightBoundary();
      break;
    default: finishNavigation();
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
    return FeatureQueries.moreFavoritesPagesExist.query(direction);
  }
  return (FeatureQueries.moreSearchPagesExist.query(direction)) !== null;
}

function finishNavigation(): void {
  const thumb = GalleryModel.getCurrentThumb();

  GalleryView.showContentInGallery(thumb);
  GalleryAutoplayController.startViewTimer(thumb);
  GalleryPreloadFlow.preloadInGalleryAround(thumb);
}
