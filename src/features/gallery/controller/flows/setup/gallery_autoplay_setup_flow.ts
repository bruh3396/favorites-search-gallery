import * as GalleryAutoplayController from "../../../autoplay/gallery_autoplay_controller";
import * as GalleryNavigationFlow from "../runtime/gallery_navigation_flow";
import * as GalleryView from "../../../view/gallery_view";
import { NavigationKey } from "../../../../../types/primitives/primitives";
import { executeFunctionBasedOnGalleryState } from "../runtime/gallery_runtime_flow_utils";

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
      executeFunctionBasedOnGalleryState({
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
