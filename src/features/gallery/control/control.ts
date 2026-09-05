import * as GalleryEdgeTapControls from "@/features/gallery/control/edge_tap_controls";
import * as GalleryInteractionTracker from "@/features/gallery/control/interaction_tracker";
import * as GalleryThumbObserver from "@/features/gallery/control/thumb_observer";

export function setup(onVisibleThumbsChanged: () => void): void {
  GalleryEdgeTapControls.setup();
  GalleryInteractionTracker.setup();
  GalleryThumbObserver.setup(onVisibleThumbsChanged);
}

export { refresh as refreshThumbObserver, setCenterThumb, getVisibleThumbs } from "@/features/gallery/control/thumb_observer";
export { enableInteractionTracking, disableInteractionTracking } from "@/features/gallery/control/interaction_tracker";
