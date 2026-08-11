import * as GalleryDispatch from "@/features/gallery/flows/dispatch";
import * as GalleryView from "@/features/gallery/view/gallery_view";

export function onInteractionStopped(): void {
  GalleryDispatch.run({ open: () => GalleryView.toggleCursor(false) });
}
