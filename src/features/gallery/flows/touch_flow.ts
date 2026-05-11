import * as GalleryNavigationFlow from "./navigation_flow";
import * as GalleryStateFlow from "./state_flow";
import { ON_FAVORITES_PAGE, ON_SEARCH_PAGE } from "../../../lib/environment/environment";
import { EnhancedMouseEvent } from "../../../lib/dom/input_types";
import { Preferences } from "../../../lib/preferences/preferences";
import { didSwipe } from "../../../lib/communication/swipe_events";
import { dispatchByState } from "./state_dispatch";

export function onMouseDown(event: MouseEvent): void {
  dispatchByState({
    hover: onMouseDownOutsideGallery,
    idle: onMouseDownOutsideGallery
  }, new EnhancedMouseEvent(event));
}

export function onTouchStart(event: TouchEvent): void {
  dispatchByState({
    open: onTouchStartInGallery
  }, event);
}

export function onLeftTap(): void {
  if (didSwipe()) {
    return;
  }
  dispatchByState({
    open: () => {
      GalleryNavigationFlow.navigate("ArrowLeft");
    }
  });
}

export function onRightTap(): void {
  if (didSwipe()) {
    return;
  }
  dispatchByState({
    open: () => {
      GalleryNavigationFlow.navigate("ArrowRight");
    }
  });
}

export function onSwipeDown(): void {
  dispatchByState({ open: GalleryStateFlow.exitGallery });
}

function onMouseDownOutsideGallery(mouseEvent: EnhancedMouseEvent): void {
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

function galleryEnabled(): boolean {
  return (ON_FAVORITES_PAGE && Preferences.mobileGalleryEnabled.value) || (ON_SEARCH_PAGE && Preferences.searchPages.value);
}
