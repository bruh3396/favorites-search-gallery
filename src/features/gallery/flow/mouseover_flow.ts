import * as GalleryPreloadFlow from "./preload_flow";
import * as GalleryView from "../view/gallery_view";
import { EnhancedMouseEvent } from "../../../lib/dom/input_types";
import { ON_FAVORITES_PAGE } from "../../../lib/environment/environment";
import { debounceTrailing } from "../../../lib/core/scheduling/rate_limiting";
import { executeByGalleryState } from "./state_executor";

const preloadContentDebounced = debounceTrailing((thumb: HTMLElement | null) => preloadContent(thumb), 1000);

function preloadContent(thumb: HTMLElement | null): void {
  if (thumb === null || !ON_FAVORITES_PAGE) {
    return;
  }
  GalleryPreloadFlow.preloadAround(thumb);
}

function handleHover(thumb: HTMLElement | null): void {
  if (thumb === null) {
    GalleryView.hide();
    return;
  }
  GalleryView.display(thumb);

  if (ON_FAVORITES_PAGE) {
    preloadContentDebounced(thumb);
  }
}

export function onMouseOver(mouseEvent: EnhancedMouseEvent): void {
  executeByGalleryState({
    hover: handleHover,
    idle: preloadContentDebounced
  }, mouseEvent.thumb);
}
