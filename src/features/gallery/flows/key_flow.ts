import * as GalleryFavoriterFlow from "./favoriter_flow";
import * as GalleryModel from "../model/gallery_model";
import * as GalleryNavigationFlow from "./navigation_flow";
import * as GalleryOpenCloseFlow from "./open_close_flow";
import * as GalleryView from "../view/gallery_view";
import { isExitKey, isNavigationKey } from "../../../types/guards";
import { EnhancedKeyboardEvent } from "../../../types/input";
import { GalleryConfig } from "../../../config/gallery_config";
import { dispatchByState } from "./state_dispatch";
import { throttle } from "../../../lib/async/throttle";
import { toggleFullscreen } from "../../../utils/browser/window";

const insideGalleryHotkeyHandlers: Record<string, () => void> = {
  b: GalleryView.toggleBackgroundOpacity,
  e: GalleryFavoriterFlow.addFavoriteInGallery,
  f: toggleFullscreen,
  g: GalleryOpenCloseFlow.close,
  m: GalleryView.toggleVideoMute,
  q: GalleryModel.openMedia,
  s: GalleryModel.download,
  w: GalleryModel.openPost,
  x: GalleryFavoriterFlow.removeFavoriteInGallery,
  " ": pauseVideo
};

const outsideGalleryHotkeyHandlers: Record<string, () => void> = {
  g: GalleryOpenCloseFlow.reOpen,
  f: toggleFullscreen
};

export function onKeyDown(keyboardEvent: EnhancedKeyboardEvent): void {
  if (keyboardEvent.originalEvent.repeat) {
    onKeyDownThrottled(keyboardEvent.originalEvent);
  } else {
    onKeyDownNoThrottle(keyboardEvent.originalEvent);
  }
}

export function onKeyUp(event: EnhancedKeyboardEvent): void {
  dispatchByState({ open: onKeyUpInGallery }, event);
}

const onKeyDownNoThrottle = (event: KeyboardEvent): void => {
  dispatchByState({
    idle: onKeyDownOutsideGallery,
    hover: onKeyDownOutsideGallery,
    open: onKeyDownInGallery
  }, new EnhancedKeyboardEvent(event));
};

const onKeyDownThrottled = throttle(onKeyDownNoThrottle, GalleryConfig.galleryNavigationDelay);

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
    GalleryOpenCloseFlow.close();
    return;
  }

  if (event.shiftKey) {
    GalleryView.toggleZoomCursor(true);
    return;
  }

  if (keyboardEvent.isHotkey) {
    insideGalleryHotkeyHandlers[event.key.toLowerCase()]?.();
  }
}

function onKeyDownOutsideGallery(event: EnhancedKeyboardEvent): void {
  if (event.isHotkey) {
    outsideGalleryHotkeyHandlers[event.key.toLowerCase()]?.();
  }
}

function onKeyUpInGallery(event: EnhancedKeyboardEvent): void {
  if (event.key === "shift") {
    GalleryView.toggleZoomCursor(false);
  }
}

function pauseVideo(): void {
  if (GalleryModel.isViewingVideo()) {
    GalleryView.toggleVideoPause();
  }
}
