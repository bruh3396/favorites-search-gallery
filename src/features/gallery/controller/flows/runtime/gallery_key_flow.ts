import * as GalleryFavoriteToggleFlow from "./gallery_favorite_toggle_flow";
import * as GalleryModel from "../../../model/gallery_model";
import * as GalleryNavigationFlow from "./gallery_navigation_flow";
import * as GalleryStateFlow from "./gallery_state_flow";
import * as GalleryView from "../../../view/gallery_view";
import { isExitKey, isNavigationKey } from "../../../../../types/equivalence";
import { FavoritesKeyboardEvent } from "../../../../../types/input_types";
import { executeFunctionBasedOnGalleryState } from "./gallery_runtime_flow_utils";
import { isVideo } from "../../../../../utils/content/content_type";
import { throttle } from "../../../../../utils/misc/async";
import { toggleFullscreen } from "../../../../../utils/dom/dom";

function onKeyDownInGallery(keyboardEvent: FavoritesKeyboardEvent): void {
  const event = keyboardEvent.originalEvent;

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
  const currentThumb = GalleryModel.getCurrentThumb();

  switch (event.key.toLowerCase()) {
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
      if (currentThumb !== undefined && isVideo(currentThumb)) {
        GalleryView.toggleVideoPause();
      }
      break;

    default:
      break;
  }
}

function onKeyDownOutsideGallery(event: FavoritesKeyboardEvent): void {
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
  }, new FavoritesKeyboardEvent(event));
};

const onKeyDownThrottled = throttle(onKeyDownNoThrottle, 100);

function onKeyUpInGallery(event: FavoritesKeyboardEvent): void {
  if (event.key === "shift") {
    GalleryView.toggleZoomCursor(false);
  }
}

export function onKeyDown(keyboardEvent: FavoritesKeyboardEvent): void {
  const event = keyboardEvent.originalEvent;

  if (event.repeat) {
    onKeyDownThrottled(event);
  } else {
    onKeyDownNoThrottle(event);
  }
}

export function onKeyUp(event: FavoritesKeyboardEvent): void {
  executeFunctionBasedOnGalleryState({
    gallery: onKeyUpInGallery
  }, event);
}
