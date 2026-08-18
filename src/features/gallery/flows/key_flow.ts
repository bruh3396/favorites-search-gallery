import * as GalleryBackgroundFlow from "@/features/gallery/flows/background_flow";
import * as GalleryDispatch from "@/features/gallery/flows/dispatch";
import * as GalleryFavoriterFlow from "@/features/gallery/flows/favoriter_flow";
import * as GalleryModel from "@/features/gallery/model/gallery_model";
import * as GalleryNavigationFlow from "@/features/gallery/flows/navigation_flow";
import * as GalleryOpenCloseFlow from "@/features/gallery/flows/open_close_flow";
import * as GalleryVideoFlow from "@/features/gallery/flows/video_flow";
import * as GalleryView from "@/features/gallery/view/gallery_view";
import { isExitKey, isNavigationKey } from "@/types/guards";
import { EnhancedKeyboardEvent } from "@/lib/input";
import { GalleryConfig } from "@/config/gallery_config";
import { throttle } from "@/lib/async/rate_limiting";
import { toggleFullscreen } from "@/utils/platform/browser";

const insideGalleryHotkeyHandlers: Record<string, () => void> = {
  b: GalleryBackgroundFlow.toggleBackgroundOpacity,
  e: GalleryFavoriterFlow.addFavoriteInGallery,
  f: toggleFullscreen,
  g: GalleryOpenCloseFlow.close,
  m: GalleryVideoFlow.toggleVideoMute,
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

export function handleKeyDown(keyboardEvent: EnhancedKeyboardEvent): void {
  if (keyboardEvent.originalEvent.repeat) {
    handleKeyDownThrottled(keyboardEvent.originalEvent);
  } else {
    handleKeyDownNoThrottle(keyboardEvent.originalEvent);
  }
}

export function handleKeyUp(event: EnhancedKeyboardEvent): void {
  GalleryDispatch.run({ open: handleKeyUpInGallery }, event);
}

const handleKeyDownNoThrottle = (event: KeyboardEvent): void => {
  GalleryDispatch.run({
    idle: handleKeyDownOutsideGallery,
    preview: handleKeyDownOutsideGallery,
    open: handleKeyDownInGallery
  }, new EnhancedKeyboardEvent(event));
};

const handleKeyDownThrottled = throttle(handleKeyDownNoThrottle, GalleryConfig.galleryNavigationDelay);

function handleKeyDownInGallery(keyboardEvent: EnhancedKeyboardEvent): void {
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

function handleKeyDownOutsideGallery(event: EnhancedKeyboardEvent): void {
  if (event.isHotkey) {
    outsideGalleryHotkeyHandlers[event.key.toLowerCase()]?.();
  }
}

function handleKeyUpInGallery(event: EnhancedKeyboardEvent): void {
  if (event.key === "shift") {
    GalleryView.toggleZoomCursor(false);
  }
}

function pauseVideo(): void {
  if (GalleryModel.isViewingVideo()) {
    GalleryView.toggleVideoPause();
  }
}
