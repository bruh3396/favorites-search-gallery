import * as GalleryEdgeTapControls from "./edge_tap_controls";
import * as GalleryInteractionTracker from "./interaction_tracker";
import * as GalleryVisibleThumbObserver from "./visible_thumb_observer";

export function setupGalleryControl(): void {
  GalleryEdgeTapControls.setupGalleryMobileTapControls();
  GalleryInteractionTracker.setupGalleryInteractionTracker();
  GalleryVisibleThumbObserver.setupVisibleThumbObserver();
}
