import * as GalleryFavoriteToggleFlow from "./favorite_toggle_flow";
import * as GalleryModel from "../model/model";
import * as GalleryNavigationFlow from "./navigation_flow";
import * as GalleryStateFlow from "./state_flow";
import * as GalleryView from "../view/gallery_view";
import { isExitKey, isNavigationKey } from "../../../types/guards";
import { EnhancedKeyboardEvent } from "../../../lib/dom/input_types";
import { GallerySettings } from "../../../config/gallery_settings";
import { executeByGalleryState } from "./state_executor";
import { throttle } from "../../../lib/core/scheduling/rate_limiting";
import { toggleFullscreen } from "../../../utils/browser/window";

function pauseVideo(): void {
  if (GalleryModel.isViewingVideo()) {
    GalleryView.toggleVideoPause();
  }
}

const inGalleryHotkeyHandlers: Record<string, () => void> = {
  b: GalleryView.toggleBackgroundOpacity,
  e: GalleryFavoriteToggleFlow.addFavoriteInGallery,
  f: toggleFullscreen,
  g: GalleryStateFlow.exitGallery,
  m: GalleryView.toggleVideoMute,
  q: GalleryModel.openOriginalInNewTab,
  s: GalleryModel.downloadInGallery,
  w: GalleryModel.openPostInNewTab,
  x: GalleryFavoriteToggleFlow.removeFavoriteInGallery,
  " ": pauseVideo
};

const outsideGalleryHotkeyHandlers: Record<string, () => void> = {
  g: GalleryStateFlow.reEnterGallery,
  f: toggleFullscreen
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
    inGalleryHotkeyHandlers[event.key.toLowerCase()]?.();
  }
}

function onKeyDownOutsideGallery(event: EnhancedKeyboardEvent): void {
  if (event.isHotkey) {
    outsideGalleryHotkeyHandlers[event.key.toLowerCase()]?.();
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
