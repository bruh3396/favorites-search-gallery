import * as GalleryAutoplayController from "../../../autoplay/gallery_autoplay_controller";
import * as GalleryModel from "../../../model/gallery_model";
import * as GalleryPreloadFlow from "./gallery_preload_flow";
import * as GalleryView from "../../../view/gallery_view";
import { CrossFeatureRequests } from "../../../../../lib/global/cross_feature_requests";
import { GalleryBoundary } from "../../../types/gallery_types";
import { NavigationKey } from "../../../../../types/common_types";
import { ON_FAVORITES_PAGE } from "../../../../../lib/global/flags/intrinsic_flags";
import { usingInfiniteScroll } from "../../../../../utils/misc/layout";

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

async function navigateAtLeftBoundary(): Promise<void> {
  if (!usingInfiniteScroll() && await loadMoreResults("ArrowLeft")) {
    GalleryModel.navigateToPreviousPage();
    finishNavigation();
  }
}

async function navigateAtRightBoundary(): Promise<void> {
  if (await loadMoreResults("ArrowRight")) {
    if (usingInfiniteScroll()) {
      GalleryModel.navigateRight();
    } else {
      GalleryModel.navigateToNextPage();
    }
    finishNavigation();
  }
}

async function loadMoreResults(direction: NavigationKey): Promise<boolean> {
  if (ON_FAVORITES_PAGE) {
    return CrossFeatureRequests.loadNewFavoritesInGallery.request(direction);
  }
  return (await CrossFeatureRequests.loadNewSearchPagesInGallery.request(direction)) !== null;
}

function finishNavigation(): void {
  const thumb = GalleryModel.getCurrentThumb();

  GalleryView.showContentInGallery(thumb);
  GalleryAutoplayController.startViewTimer(thumb);
  GalleryPreloadFlow.preloadContentInGalleryAround(thumb);
}
