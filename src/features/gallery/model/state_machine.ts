import { GalleryState } from "../types/gallery_types";
import { Preferences } from "../../../lib/preferences/preferences";

let currentState = initialState();
let recentlyExitedGallery = false;

export function getCurrentState(): GalleryState {
  return currentState;
}

export function inGallery(): boolean {
  return currentState === GalleryState.IN_GALLERY;
}

export function enlargingOnHover(): boolean {
  return currentState === GalleryState.ENLARGE_ON_HOVER;
}

export function hasRecentlyExitedGallery(): boolean {
  return recentlyExitedGallery;
}

export function enterGallery(): void {
  currentState = GalleryState.IN_GALLERY;
}

export function exitGallery(): void {
  currentState = GalleryState.IDLE;
  recentlyExitedGallery = true;
  setTimeout(() => {
    recentlyExitedGallery = false;
  }, 500);
}

export function toggleShowingMediaOnHover(): void {
  currentState = currentState === GalleryState.ENLARGE_ON_HOVER ? GalleryState.IDLE : GalleryState.ENLARGE_ON_HOVER;
}

function initialState(): GalleryState {
  return Preferences.showOnHover.value ? GalleryState.ENLARGE_ON_HOVER : GalleryState.IDLE;
}
