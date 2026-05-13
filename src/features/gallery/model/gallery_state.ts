import { GalleryConfig } from "../../../config/gallery_config";
import { GalleryState } from "../types/gallery_types";
import { Preferences } from "../../../lib/preferences/preferences";

let currentState = initialState();
let recentlyClosed = false;

export const getCurrentState = (): GalleryState => currentState;
export const isInGallery = (): boolean => currentState === GalleryState.Open;
export const isEnlargingOnHover = (): boolean => currentState === GalleryState.Hover;
export const hasRecentlyExitedGallery = (): boolean => recentlyClosed;

export function open(): void {
  currentState = GalleryState.Open;
}

export function close(): void {
  currentState = GalleryState.Idle;
  recentlyClosed = true;
  setTimeout(() => {
    recentlyClosed = false;
  }, GalleryConfig.recentCloseDuration);
}

export function toggleEnlargeOnHover(): void {
  currentState = currentState === GalleryState.Hover ? GalleryState.Idle : GalleryState.Hover;
}

function initialState(): GalleryState {
  return Preferences.showOnHover.value ? GalleryState.Hover : GalleryState.Idle;
}
