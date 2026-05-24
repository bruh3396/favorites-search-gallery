import * as GalleryPreloadFlow from "./preload_flow";
import * as GalleryView from "../view/gallery_view";
import { EnhancedMouseEvent } from "../../../types/input";
import { ON_FAVORITES_PAGE } from "../../../lib/environment/environment";
import { debounceTrailing } from "../../../lib/async/debounce";
import { dispatchByState } from "./state_dispatch";

export function onMouseOver(mouseEvent: EnhancedMouseEvent): void {
  dispatchByState({
    hover: handleHover,
    idle: preloadMediaAroundDebounced
  }, mouseEvent.thumb);
}

function handleHover(thumb: HTMLElement | null): void {
  if (thumb === null) {
    GalleryView.hidePreview();
    return;
  }
  GalleryView.displayPreview(thumb);

  if (ON_FAVORITES_PAGE) {
    preloadMediaAroundDebounced(thumb);
  }
}

const preloadMediaAroundDebounced = debounceTrailing((thumb: HTMLElement | null) => preloadMediaAround(thumb), 1000);

function preloadMediaAround(thumb: HTMLElement | null): void {
  if (thumb === null || !ON_FAVORITES_PAGE) {
    return;
  }
  GalleryPreloadFlow.preloadVisibleThumbsAround(thumb);
}
