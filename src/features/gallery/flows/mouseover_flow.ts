import * as GalleryPreloadFlow from "./preload_flow";
import * as GalleryView from "../view/gallery_view";
import { EnhancedMouseEvent } from "../../../lib/dom/input_types";
import { ON_FAVORITES_PAGE } from "../../../lib/environment/environment";
import { debounceTrailing } from "../../../lib/core/scheduling/rate_limiting";
import { executeByGalleryState } from "./state_executor";

export function onMouseOver(mouseEvent: EnhancedMouseEvent): void {
  executeByGalleryState({
    hover: handleHover,
    idle: preloadMediaAroundDebounced
  }, mouseEvent.thumb);
}

function handleHover(thumb: HTMLElement | null): void {
  if (thumb === null) {
    GalleryView.hide();
    return;
  }
  GalleryView.display(thumb);

  if (ON_FAVORITES_PAGE) {
    preloadMediaAroundDebounced(thumb);
  }
}

const preloadMediaAroundDebounced = debounceTrailing((thumb: HTMLElement | null) => preloadMediaAround(thumb), 1000);

function preloadMediaAround(thumb: HTMLElement | null): void {
  if (thumb === null || !ON_FAVORITES_PAGE) {
    return;
  }
  GalleryPreloadFlow.preloadAround(thumb);
}
