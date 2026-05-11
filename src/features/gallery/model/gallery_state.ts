import { GalleryConfig } from "../../../config/gallery_config";
import { GalleryState } from "../types/gallery_types";
import { Preferences } from "../../../lib/preferences/preferences";

let currentState = initialState();
let recentlyExitedGallery = false;

export const getCurrentState = (): GalleryState => currentState;
export const isInGallery = (): boolean => currentState === GalleryState.Open;
export const isEnlargingOnHover = (): boolean => currentState === GalleryState.Hover;
export const hasRecentlyExitedGallery = (): boolean => recentlyExitedGallery;

export function enterGallery(): void {
  currentState = GalleryState.Open;
}

export function exitGallery(): void {
  currentState = GalleryState.Idle;
  recentlyExitedGallery = true;
  setTimeout(() => {
    recentlyExitedGallery = false;
  }, GalleryConfig.recentExitDuration);
}

export function toggleEnlargeOnHover(): void {
  currentState = currentState === GalleryState.Hover ? GalleryState.Idle : GalleryState.Hover;
}

function initialState(): GalleryState {
  return Preferences.showOnHover.value ? GalleryState.Hover : GalleryState.Idle;
}
