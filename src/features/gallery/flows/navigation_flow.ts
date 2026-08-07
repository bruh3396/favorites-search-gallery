import * as GalleryDisplayFlow from "@/features/gallery/flows/display_flow";
import * as GalleryModel from "@/features/gallery/model/gallery_model";
import * as GalleryView from "@/features/gallery/view/gallery_view";
import { FeatureBridge, usingInfiniteScroll } from "@/app/channels/feature_bridge";
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
  if (usingInfiniteScroll() || !loadMoreResults("ArrowLeft")) {
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

  if (usingInfiniteScroll()) {
    GalleryModel.move("ArrowRight");
  } else {
    GalleryModel.jumpToFirst();
  }
  GalleryDisplayFlow.displaySelected();
}

function loadMoreResults(direction: NavigationKey): boolean {
  if (ON_POST_LIST_PAGE) {
    return FeatureBridge.postList.navigateToAdjacent.call(direction) !== null;
  }
  return FeatureBridge.favorites.loadMore.call(direction);
}
