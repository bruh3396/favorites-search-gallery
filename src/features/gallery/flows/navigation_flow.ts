import * as GalleryDisplayFlow from "@/features/gallery/flows/display_flow";
import * as GalleryModel from "@/features/gallery/model/gallery_model";
import * as GalleryView from "@/features/gallery/view/gallery_view";
import { FeatureBridge } from "@/app/channels/feature_bridge";
import { NavigationKey } from "@/types/input";
import { ON_POST_LIST_PAGE } from "@/lib/environment";

export function navigate(direction: NavigationKey): void {
  switch (GalleryModel.move(direction)) {
    case "start": handleStartBoundary();
      break;
    case "end": handleEndBoundary();
      break;
    case "none":
      GalleryDisplayFlow.displaySelected();
      break;
    default:
      break;
  }
}

function handleStartBoundary(): void {
  if (FeatureBridge.usingInfiniteScroll.call() || !loadMoreResults("ArrowLeft")) {
    GalleryView.nudge(GalleryModel.currentThumb(), "start");
    return;
  }
  GalleryModel.jumpToLast();
  GalleryDisplayFlow.displaySelected();
}

function handleEndBoundary(): void {
  if (!loadMoreResults("ArrowRight")) {
    GalleryView.nudge(GalleryModel.currentThumb(), "end");
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
  return FeatureBridge.loadMoreFavorites.call(direction);
}
