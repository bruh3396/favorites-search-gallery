import * as GalleryNavigationFlow from "./gallery_navigation_flow";
import * as GalleryStateFlow from "./gallery_state_flow";
import { FavoritesMouseEvent } from "../../../../../types/events/mouse_event";
import { didSwipe } from "../../events/mobile/gallery_swipe_controls";
import { executeFunctionBasedOnGalleryState } from "./gallery_runtime_flow_utils";

function onMouseDownOutsideGallery(mouseEvent: FavoritesMouseEvent): void {
  if (mouseEvent.thumb !== null) {
    mouseEvent.originalEvent.preventDefault();
    GalleryStateFlow.enterGallery(mouseEvent.thumb);
  }
}

function onTouchStartInGallery(event: TouchEvent): void {
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
