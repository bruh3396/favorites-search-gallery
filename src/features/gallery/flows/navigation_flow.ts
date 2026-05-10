import * as GalleryAutoplayController from "../features/autoplay/autoplay";
import * as GalleryModel from "../model/gallery_model";
import * as GalleryPreloadFlow from "./preload_flow";
import * as GalleryView from "../view/gallery_view";
import { FeatureBridge } from "../../../lib/communication/feature_bridge";
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
    case GalleryBoundary.IN_BOUNDS:
      finishNavigation();
      break;
    default:
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
    return FeatureBridge.navigateToAdjacentFavoritesPage.call(direction);
  }
  return (FeatureBridge.navigateToAdjacentSearchPage.call(direction)) !== null;
}

function finishNavigation(): void {
  const thumb = GalleryModel.getCurrentThumb();

  GalleryView.present(thumb);
  GalleryAutoplayController.startViewTimer(thumb);
  GalleryPreloadFlow.preloadInGalleryAround(thumb);
}
