import * as GalleryDisplayFlow from "@/features/gallery/flows/display_flow";
import * as GalleryModel from "@/features/gallery/model/gallery_model";
import { Boundary } from "@/types/boundary";
import { FeatureBridge } from "@/app/channels/feature_bridge";
import { NavigationKey } from "@/types/input";
import { ON_POST_LIST_PAGE } from "@/lib/environment";

export function navigate(direction: NavigationKey): void {
  switch (GalleryModel.move(direction)) {
    case Boundary.Start: handleStartBoundary();
      break;
    case Boundary.End: handleEndBoundary();
      break;
    case Boundary.None:
      GalleryDisplayFlow.displaySelected();
      break;
    default:
      break;
  }
}

function handleStartBoundary(): void {
  if (FeatureBridge.usingInfiniteScroll.call() || !loadMoreResults("ArrowLeft")) {
    return;
  }
  GalleryModel.jumpToLast();
  GalleryDisplayFlow.displaySelected();
}

function handleEndBoundary(): void {
  if (!loadMoreResults("ArrowRight")) {
    return;
  }

  if (FeatureBridge.usingInfiniteScroll.call()) {
    GalleryModel.move("ArrowRight");
  } else {
    GalleryModel.jumpToFirst();
  }
  GalleryDisplayFlow.displaySelected();
}

function loadMoreResults(direction: NavigationKey): boolean {
  if (ON_POST_LIST_PAGE) {
    return FeatureBridge.navigateToAdjacentPostList.call(direction) !== null;
  }

  if (!FeatureBridge.favoritesCanExtend.call()) {
    return false;
  }
  FeatureBridge.loadMoreFavorites.call(direction);
  return true;
}
