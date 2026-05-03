import * as GalleryFavoriteToggleFlow from "./gallery_favorite_toggle_flow";
import * as GalleryModel from "../model/gallery_model";
import * as GalleryNavigationFlow from "./gallery_navigation_flow";
import * as GalleryStateFlow from "./gallery_state_flow";
import * as GalleryView from "../view/gallery_view";
import { isExitKey, isNavigationKey } from "../../../types/guards";
import { EnhancedKeyboardEvent } from "../../../lib/dom/input_types";
import { GallerySettings } from "../../../config/gallery_settings";
import { executeByGalleryState } from "./gallery_state_executor";
import { throttle } from "../../../lib/core/scheduling/rate_limiting";
import { toggleFullscreen } from "../../../utils/browser/window";

const hotKeyHandlers: Record<string, () => void> = {
  b: GalleryView.toggleBackgroundOpacity,
  e: GalleryFavoriteToggleFlow.addFavoriteInGallery,
  x: GalleryFavoriteToggleFlow.removeFavoriteInGallery,
  f: toggleFullscreen,
  g: GalleryModel.openPostInNewTab,
  q: GalleryModel.openOriginalInNewTab,
  s: GalleryModel.downloadInGallery,
  m: GalleryView.toggleVideoMute,
  " ": () => {
    if (GalleryModel.isViewingVideo()) {
      GalleryView.toggleVideoPause();
    }
  }
};

function onKeyDownInGallery(keyboardEvent: EnhancedKeyboardEvent): void {
  const event = keyboardEvent.originalEvent;

  if (event.ctrlKey) {
    return;
  }

  if (isNavigationKey(event.key)) {
    event.stopImmediatePropagation();
    GalleryNavigationFlow.navigate(event.key);
    return;
  }

  if (isExitKey(event.key)) {
    GalleryStateFlow.exitGallery();
    return;
  }

  if (event.shiftKey) {
    GalleryView.toggleZoomCursor(true);
    return;
  }

  if (keyboardEvent.isHotkey) {
    hotKeyHandlers[event.key.toLowerCase()]?.();
  }
}

function onKeyDownOutsideGallery(event: EnhancedKeyboardEvent): void {
  if (event.isHotkey && event.key.toLowerCase() === "f") {
    toggleFullscreen();
  }
}

const onKeyDownNoThrottle = (event: KeyboardEvent): void => {
  executeByGalleryState({
    idle: onKeyDownOutsideGallery,
    hover: onKeyDownOutsideGallery,
    gallery: onKeyDownInGallery
  }, new EnhancedKeyboardEvent(event));
};

const onKeyDownThrottled = throttle(onKeyDownNoThrottle, GallerySettings.galleryNavigationDelay);

function onKeyUpInGallery(event: EnhancedKeyboardEvent): void {
  if (event.key === "shift") {
    GalleryView.toggleZoomCursor(false);
  }
}

export function onKeyDown(keyboardEvent: EnhancedKeyboardEvent): void {
  if (keyboardEvent.originalEvent.repeat) {
    onKeyDownThrottled(keyboardEvent.originalEvent);
  } else {
    onKeyDownNoThrottle(keyboardEvent.originalEvent);
  }
}

export function onKeyUp(event: EnhancedKeyboardEvent): void {
  executeByGalleryState({ gallery: onKeyUpInGallery }, event);
}
