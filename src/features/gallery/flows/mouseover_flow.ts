import * as GalleryDispatch from "@/features/gallery/flows/dispatch";
import * as GalleryView from "@/features/gallery/view/gallery_view";
import * as GalleryVisibilityFlow from "@/features/gallery/flows/visibility_flow";
import { EnhancedMouseEvent } from "@/lib/input";
import { ON_FAVORITES_PAGE } from "@/lib/environment";
import { debounceTrailing } from "@/lib/async/rate_limiting";

export function handleMouseOver(mouseEvent: EnhancedMouseEvent): void {
  GalleryDispatch.run({
    preview: handlePreview,
    idle: upscaleAround
  }, mouseEvent.thumb);
}

function handlePreview(thumb: HTMLElement | null): void {
  if (thumb === null) {
    GalleryView.hidePreview();
    return;
  }
  GalleryView.showPreview(thumb);
  cacheAround(thumb);
}

const upscaleAround = debounceTrailing((thumb: HTMLElement | null) => {
  if (thumb !== null && ON_FAVORITES_PAGE) {
    GalleryVisibilityFlow.upscaleVisibleThumbsAround(thumb);
  }
}, 1_000);

const cacheAround = debounceTrailing((thumb: HTMLElement | null) => {
  if (thumb !== null && ON_FAVORITES_PAGE) {
    GalleryVisibilityFlow.cacheVisibleThumbsAround(thumb);
  }
}, 1_000);
