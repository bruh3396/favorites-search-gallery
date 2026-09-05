import * as GalleryFlows from "@/features/gallery/flows/flows";
import * as GalleryView from "@/features/gallery/view/view";
import { throttle } from "@/lib/async/rate_limiting";

export const showCursorInGallery = throttle<MouseEvent>(() => {
  GalleryFlows.Dispatch.run({ open: GalleryView.showCursor });
}, 250);

export function hideCursorInGallery(): void {
  GalleryFlows.Dispatch.run({ open: () => GalleryView.toggleCursor(false) });
}
