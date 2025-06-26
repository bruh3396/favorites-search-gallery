import * as GalleryNavigationFlow from "./gallery_navigation_flow";
import * as GalleryStateFlow from "./gallery_state_flow";
import { ON_FAVORITES_PAGE, ON_SEARCH_PAGE } from "../../../../../lib/global/flags/intrinsic_flags";
import { FavoritesMouseEvent } from "../../../../../types/events/mouse_event";
import { Preferences } from "../../../../../lib/global/preferences/preferences";
import { didSwipe } from "../../../../../lib/global/events/swipe_events";
import { executeFunctionBasedOnGalleryState } from "./gallery_runtime_flow_utils";

function galleryEnabled(): boolean {
  return (ON_FAVORITES_PAGE && Preferences.mobileGalleryEnabled.value) || (ON_SEARCH_PAGE && Preferences.searchPagesEnabled.value);
}

function onMouseDownOutsideGallery(mouseEvent: FavoritesMouseEvent): void {
  if (mouseEvent.thumb !== null && galleryEnabled()) {
    mouseEvent.originalEvent.preventDefault();
    mouseEvent.originalEvent.stopPropagation();
    mouseEvent.originalEvent.stopImmediatePropagation();
    GalleryStateFlow.enterGallery(mouseEvent.thumb);
  }
}

function onTouchStartInGallery(event: TouchEvent): void {
  if (event.target instanceof HTMLElement && event.target.closest("#gallery-menu") !== null) {
    return;
  }
  event.preventDefault();
}

export function onMouseDown(event: MouseEvent): void {
  executeFunctionBasedOnGalleryState({
    hover: onMouseDownOutsideGallery,
    idle: onMouseDownOutsideGallery
  }, new FavoritesMouseEvent(event));
}

export function onTouchStart(event: TouchEvent): void {
  executeFunctionBasedOnGalleryState({
    gallery: onTouchStartInGallery
  }, event);
}

export function onLeftTap(): void {
  if (didSwipe()) {
    return;
  }
  executeFunctionBasedOnGalleryState({
    gallery: GalleryNavigationFlow.navigateLeft
  });
}

export function onRightTap(): void {
  if (didSwipe()) {
    return;
  }
  executeFunctionBasedOnGalleryState({
    gallery: GalleryNavigationFlow.navigateRight
  });
}
