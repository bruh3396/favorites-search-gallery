import * as GalleryModel from "../../../model/gallery_model";
import * as GalleryNavigationFlow from "./gallery_navigation_flow";
import * as GalleryStateFlow from "./gallery_state_flow";
import * as GalleryView from "../../../view/gallery_view";
import { isExitKey, isNavigationKey } from "../../../../../types/primitives/equivalence";
import { FavoritesKeyboardEvent } from "../../../../../types/events/keyboard_event";
import { executeFunctionBasedOnGalleryState } from "./gallery_runtime_flow_utils";
import { isVideo } from "../../../../../utils/content/content_type";
import { throttle } from "../../../../../utils/misc/async";
import { toggleFullscreen } from "../../../../../utils/dom/dom";

function onKeyDownInGallery(event: KeyboardEvent): void {
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

    // case "e":
    //   this.addCurrentFavorite();
    //   break;

    // case "x":
    //   this.removeCurrentFavorite();
    //   break;

    case "f":
      toggleFullscreen();
      break;

    case "g":
      GalleryModel.openPostInNewTab();
      break;

    case "q":
      GalleryModel.openOriginalInNewTab();
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

const onKeyDownNoThrottle = (event: KeyboardEvent): void => {
  executeFunctionBasedOnGalleryState({
    gallery: () => {
      onKeyDownInGallery(event);
    }
  }, event);
};

const onKeyDownThrottled = throttle(onKeyDownInGallery, 100);

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
    gallery: (keyEvent) => {
      if (keyEvent.key === "shift") {
        GalleryView.toggleZoomCursor(false);
      }
    }
  }, event);
}
