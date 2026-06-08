import { GalleryConfig } from "@/config/gallery_config";
import { GalleryState } from "@/types/ui";
import { Preferences } from "@/app/context/preferences";

let currentState = initialState();
let recentlyClosed = false;

export const getCurrentState = (): GalleryState => currentState;
export const isInGallery = (): boolean => currentState === GalleryState.Open;
export const isShowingPreviews = (): boolean => currentState === GalleryState.Preview;
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

export function togglePreviews(): void {
  currentState = currentState === GalleryState.Preview ? GalleryState.Idle : GalleryState.Preview;
}

function initialState(): GalleryState {
  return Preferences.galleryPreviewEnabled.value ? GalleryState.Preview : GalleryState.Idle;
}
