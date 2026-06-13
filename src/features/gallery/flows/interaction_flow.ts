import * as GalleryView from "@/features/gallery/view/gallery_view";
import * as GalleryDispatch from "@/features/gallery/flows/dispatch";

export function onInteractionStopped(): void {
  GalleryDispatch.run({ open: () => GalleryView.toggleCursor(false) });
}
