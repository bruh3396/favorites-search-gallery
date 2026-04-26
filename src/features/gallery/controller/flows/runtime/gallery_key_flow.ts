import * as GalleryFavoriteToggleFlow from "./gallery_favorite_toggle_flow";
import * as GalleryModel from "../../../model/gallery_model";
import * as GalleryNavigationFlow from "./gallery_navigation_flow";
import * as GalleryStateFlow from "./gallery_state_flow";
import * as GalleryView from "../../../view/gallery_view";
import { isExitKey, isNavigationKey } from "../../../../../types/equivalence";
import { EnhancedKeyboardEvent } from "../../../../../types/input_types";
import { GallerySettings } from "../../../../../config/gallery_settings";
import { executeFunctionBasedOnGalleryState } from "./gallery_runtime_flow_utils";
import { throttle } from "../../../../../lib/core/async/rate_limiter";
import { toggleFullscreen } from "../../../../../utils/dom/dom";

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
    executeGalleryHotkey(event.key.toLowerCase());
  }
}

function executeGalleryHotkey(key: string): void {
  switch (key) {
    case "b":
      GalleryView.toggleBackgroundOpacity();
      break;

    case "e":
      GalleryFavoriteToggleFlow.addFavoriteInGallery();
      break;

    case "x":
      GalleryFavoriteToggleFlow.removeFavoriteInGallery();
      break;

    case "f":
      toggleFullscreen();
      break;

    case "g":
      GalleryModel.openPostInNewTab();
      break;

    case "q":
      GalleryModel.openOriginalInNewTab();
      break;

    case "s":
      GalleryModel.downloadInGallery();
      break;

    case "m":
      GalleryView.toggleVideoMute();
      break;

    case " ":
      if (GalleryModel.isViewingVideo()) {
        GalleryView.toggleVideoPause();
      }
      break;

    default:
      break;
  }
}

function onKeyDownOutsideGallery(event: EnhancedKeyboardEvent): void {
  if (!event.isHotkey) {
    return;
  }

  switch (event.key.toLowerCase()) {
    case "f":
      toggleFullscreen();
      break;

    default:
      break;
  }
}

const onKeyDownNoThrottle = (event: KeyboardEvent): void => {
  executeFunctionBasedOnGalleryState({
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
  const event = keyboardEvent.originalEvent;

  if (event.repeat) {
    onKeyDownThrottled(event);
  } else {
    onKeyDownNoThrottle(event);
  }
}

export function onKeyUp(event: EnhancedKeyboardEvent): void {
  executeFunctionBasedOnGalleryState({
    gallery: onKeyUpInGallery
  }, event);
}
