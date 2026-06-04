import * as GalleryView from "@/features/gallery/view/gallery_view";
import { dispatchByState } from "@/features/gallery/flows/state_dispatch";

export function onInteractionStopped(): void {
  dispatchByState({ open: () => GalleryView.toggleCursor(false) });
}
