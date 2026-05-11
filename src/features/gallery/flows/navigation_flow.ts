import * as GalleryModel from "../model/gallery_model";
import * as GalleryPresentationFlow from "./presentation_flow";
import { FeatureBridge } from "../../../lib/communication/feature_bridge";
import { NavigationBoundary } from "../types/gallery_types";
import { NavigationKey } from "../../../types/input";
import { ON_FAVORITES_PAGE } from "../../../lib/environment/environment";
import { usingInfiniteScroll } from "../../../lib/preferences/infinite_scroll";

export function navigate(direction: NavigationKey): void {
  switch (GalleryModel.move(direction)) {
    case NavigationBoundary.Left: handleLeftBoundary();
      break;
    case NavigationBoundary.Right: handleRightBoundary();
      break;
    case NavigationBoundary.None:
      GalleryPresentationFlow.presentSelected();
      break;
    default:
      break;
  }
}

function handleLeftBoundary(): void {
  if (!usingInfiniteScroll() && requestAdjacentPage("ArrowLeft")) {
    GalleryModel.jumpToLast();
    GalleryPresentationFlow.presentSelected();
  }
}

function handleRightBoundary(): void {
  if (!requestAdjacentPage("ArrowRight")) {
    return;
  }

  if (usingInfiniteScroll()) {
    GalleryModel.move("ArrowRight");
  } else {
    GalleryModel.jumpToFirst();
  }
  GalleryPresentationFlow.presentSelected();
}

function requestAdjacentPage(direction: NavigationKey): boolean {
  if (ON_FAVORITES_PAGE) {
    return FeatureBridge.navigateToAdjacentFavoritesPage.call(direction);
  }
  return (FeatureBridge.navigateToAdjacentSearchPage.call(direction)) !== null;
}
