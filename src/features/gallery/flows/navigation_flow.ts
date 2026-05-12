import * as GalleryModel from "../model/gallery_model";
import * as GalleryPresentationFlow from "./presentation_flow";
import { Boundary } from "../types/gallery_types";
import { FeatureBridge } from "../../../lib/communication/feature_bridge";
import { NavigationKey } from "../../../types/input";
import { ON_FAVORITES_PAGE } from "../../../lib/environment/environment";
import { usingInfiniteScroll } from "../../../lib/preferences/infinite_scroll";

export function navigate(direction: NavigationKey): void {
  switch (GalleryModel.move(direction)) {
    case Boundary.Start: handleStartBoundary();
      break;
    case Boundary.End: handleEndBoundary();
      break;
    case Boundary.None:
      GalleryPresentationFlow.presentSelected();
      break;
    default:
      break;
  }
}

function handleStartBoundary(): void {
  if (!usingInfiniteScroll() && requestAdjacentPage("ArrowLeft")) {
    GalleryModel.jumpToLast();
    GalleryPresentationFlow.presentSelected();
  }
}

function handleEndBoundary(): void {
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
