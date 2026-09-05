import * as GalleryFlows from "@/features/gallery/flows/flows";
import * as GalleryModel from "@/features/gallery/model/model";
import * as GalleryView from "@/features/gallery/view/view";
import { isExitKey, isNavigationKey } from "@/types/guards";
import { EnhancedKeyboardEvent } from "@/lib/input";
import { GalleryConfig } from "@/config/gallery_config";
import { throttle } from "@/lib/async/rate_limiting";
import { toggleFullscreen } from "@/utils/browser/window";

const insideGalleryHotkeyHandlers: Record<string, () => void> = {
  b: () => GalleryFlows.Background.toggleBackgroundOpacity(),
  e: () => GalleryFlows.Favoriter.addFavoriteInGallery(),
  f: toggleFullscreen,
  g: () => GalleryFlows.OpenClose.close(),
  m: () => GalleryFlows.Video.toggleVideoMute(),
  q: GalleryModel.openMedia,
  s: GalleryModel.download,
  w: GalleryModel.openPost,
  // x: () => GalleryFlows.Favoriter.removeFavoriteInGallery(),
  " ": pauseVideo
};

const outsideGalleryHotkeyHandlers: Record<string, () => void> = {
  g: () => GalleryFlows.OpenClose.reOpen(),
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
  GalleryFlows.Dispatch.run({ open: handleKeyUpInGallery }, event);
}

const handleKeyDownNoThrottle = (event: KeyboardEvent): void => {
  GalleryFlows.Dispatch.run({
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
    GalleryFlows.Navigation.navigate(event.key);
    return;
  }

  if (isExitKey(event.key)) {
    GalleryFlows.OpenClose.close();
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
