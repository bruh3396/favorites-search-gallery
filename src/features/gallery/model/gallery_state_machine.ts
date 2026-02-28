import { GalleryState } from "../types/gallery_types";
import { Preferences } from "../../../lib/global/preferences/preferences";

let currentState = getStartState();

export function getCurrentState(): GalleryState {
  return currentState;
}

export function changeState(state: GalleryState): void {
  currentState = state;
}

function getStartState(): GalleryState {
  if (Preferences.showOnHoverEnabled.value) {
    return GalleryState.SHOWING_CONTENT_ON_HOVER;
  }
  return GalleryState.IDLE;
}
