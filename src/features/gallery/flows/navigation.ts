import * as GalleryFlows from "@/features/gallery/flows/flows";
import * as GalleryModel from "@/features/gallery/model/model";
import * as GalleryView from "@/features/gallery/view/view";
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
      GalleryFlows.Display.displaySelected();
      break;
    default:
      break;
  }
}

function handleStartBoundary(): void {
  if (usingInfiniteScroll() || !advanceResults("ArrowLeft")) {
    GalleryView.nudge(GalleryModel.currentThumb(), "start");
    return;
  }
  GalleryModel.jumpToLast();
  GalleryFlows.Display.displaySelected();
}

function handleEndBoundary(): void {
  if (!advanceResults("ArrowRight")) {
    GalleryView.nudge(GalleryModel.currentThumb(), "end");
    return;
  }

  if (usingInfiniteScroll()) {
    GalleryModel.move("ArrowRight");
  } else {
    GalleryModel.jumpToFirst();
  }
  GalleryFlows.Display.displaySelected();
}

function advanceResults(direction: NavigationKey): boolean {
  if (ON_POST_LIST_PAGE) {
    return FeatureBridge.postList.navigateToAdjacent.call(direction) !== null;
  }
  return FeatureBridge.favorites.advance.call(direction);
}
