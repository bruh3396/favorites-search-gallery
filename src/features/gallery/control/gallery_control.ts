import * as GalleryEdgeTapControls from "./edge_tap_controls";
import * as GalleryInteractionTracker from "./interaction_tracker";
import * as GalleryVisibleThumbObserver from "./visible_thumb_observer";

export function setup(): void {
  GalleryEdgeTapControls.setup();
  GalleryInteractionTracker.setup();
  GalleryVisibleThumbObserver.setup();
}
