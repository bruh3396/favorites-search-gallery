import * as GalleryPreloadFlow from "@/features/gallery/flows/preload_flow";
import * as GalleryView from "@/features/gallery/view/gallery_view";
import { EnhancedMouseEvent } from "@/types/input";
import { ON_FAVORITES_PAGE } from "@/lib/environment";
import { debounceTrailing } from "@/lib/async/debounce";
import { dispatchByState } from "@/features/gallery/flows/state_dispatch";

export function onMouseOver(mouseEvent: EnhancedMouseEvent): void {
  dispatchByState({
    preview: handlePreview,
    idle: preloadMediaAround
  }, mouseEvent.thumb);
}

function handlePreview(thumb: HTMLElement | null): void {
  if (thumb === null) {
    GalleryView.hidePreview();
    return;
  }
  GalleryView.showPreview(thumb);
  preloadMediaAround(thumb);
}

const preloadMediaAround = debounceTrailing((thumb: HTMLElement | null) => {
  if (thumb !== null && ON_FAVORITES_PAGE) {
    GalleryPreloadFlow.preloadVisibleThumbsAround(thumb);
  }
}, 1_000);
