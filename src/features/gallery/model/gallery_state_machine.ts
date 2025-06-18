import { GalleryState } from "../types/gallery_types";
import { Preferences } from "../../../store/local_storage/preferences";

let currentState = getStartState();

export function getCurrentState(): GalleryState {
  return currentState;
}

export function changeState(state: GalleryState): void {
  currentState = state;
  onStateChange();
}

function getStartState(): GalleryState {
  if (Preferences.showOnHoverEnabled.value) {
    return GalleryState.SHOWING_CONTENT_ON_HOVER;
  }
  return GalleryState.IDLE;
}

function onStateChange(): void {
  switch (currentState) {
    case GalleryState.IDLE:
      // Utils.forceHideCaptions(false);
      break;

    case GalleryState.SHOWING_CONTENT_ON_HOVER:
      // Utils.forceHideCaptions(true);
      break;

    case GalleryState.IN_GALLERY:
      // Utils.forceHideCaptions(true);
      break;

    default:
      break;
  }
}
