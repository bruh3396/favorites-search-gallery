import * as GalleryAutoplayController from "../control/gallery_autoplay_controller";
import * as GalleryNavigationFlow from "./gallery_navigation_flow";
import * as GalleryView from "../view/gallery_view";
import { NavigationKey } from "../../../types/input";
import { executeByGalleryState } from "./gallery_state_executor";

export function setupAutoplay(): void {
  const events: GalleryAutoplayController.AutoplayEvents = {
    onEnable: () => {
      GalleryView.toggleVideoLooping(false);
    },
    onDisable: () => {
      GalleryView.toggleVideoLooping(true);
    },
    onPause: () => {
      GalleryView.toggleVideoLooping(true);
    },
    onResume: () => {
      GalleryView.toggleVideoLooping(false);
    },
    onComplete: (direction?: NavigationKey) => {
      executeByGalleryState({
        gallery: GalleryNavigationFlow.navigate
      }, direction);
    },
    onVideoEndedBeforeMinimumViewTime: () => {
      GalleryView.restartVideo();
    }
  };

  GalleryAutoplayController.setupAutoplay(events);
  GalleryView.toggleVideoLooping(GalleryAutoplayController.isPaused() || !GalleryAutoplayController.isActive());
}
