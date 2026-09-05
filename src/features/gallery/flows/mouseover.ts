import * as GalleryFlows from "@/features/gallery/flows/flows";
import * as GalleryView from "@/features/gallery/view/view";
import { EnhancedMouseEvent } from "@/lib/input";
import { ON_FAVORITES_PAGE } from "@/lib/environment";
import { debounceTrailing } from "@/lib/async/rate_limiting";

export function handleMouseOver(mouseEvent: EnhancedMouseEvent): void {
  GalleryFlows.Dispatch.run({
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
    GalleryFlows.Visibility.upscaleVisibleThumbsAround(thumb);
  }
}, 1_000);

const cacheAround = debounceTrailing((thumb: HTMLElement | null) => {
  if (thumb !== null && ON_FAVORITES_PAGE) {
    GalleryFlows.Visibility.cacheVisibleThumbsAround(thumb);
  }
}, 1_000);
