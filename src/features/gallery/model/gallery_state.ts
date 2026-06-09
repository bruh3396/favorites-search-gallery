import { GalleryConfig } from "@/config/gallery_config";
import { GalleryState } from "@/types/ui";
import { Preferences } from "@/app/context/preferences";

let currentState = initialState();
let recentlyClosed = false;

export const getCurrentState = (): GalleryState => currentState;
export const isInGallery = (): boolean => currentState === "open";
export const isShowingPreviews = (): boolean => currentState === "preview";
export const hasRecentlyExitedGallery = (): boolean => recentlyClosed;

export function open(): void {
  currentState = "open";
}

export function close(): void {
  currentState = "idle";
  recentlyClosed = true;
  setTimeout(() => {
    recentlyClosed = false;
  }, GalleryConfig.recentCloseDuration);
}

export function togglePreviews(): void {
  currentState = currentState === "preview" ? "idle" : "preview";
}

function initialState(): GalleryState {
  return Preferences.galleryPreviewEnabled.value ? "preview" : "idle";
}
