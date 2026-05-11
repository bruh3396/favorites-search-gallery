import * as GalleryView from "../view/gallery_view";
import { dispatchByState } from "./state_dispatch";

export function onInteractionStopped(): void {
  dispatchByState({ open: () => GalleryView.toggleCursor(false) });
}
