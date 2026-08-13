import * as GalleryDispatch from "@/features/gallery/flows/dispatch";
import * as GalleryView from "@/features/gallery/view/gallery_view";
import { throttle } from "@/lib/async/throttle";

export const showCursorInGallery = throttle<MouseEvent>(() => {
  GalleryDispatch.run({ open: GalleryView.showCursor });
}, 250);

export function hideCursorInGallery(): void {
  GalleryDispatch.run({ open: () => GalleryView.toggleCursor(false) });
}
