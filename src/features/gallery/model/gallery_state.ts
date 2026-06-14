import { GalleryState } from "@/types/app";
import { Preferences } from "@/app/context/preferences";

let currentState = initialState();

export const getCurrentState = (): GalleryState => currentState;
export const isInGallery = (): boolean => currentState === "open";
export const isShowingPreviews = (): boolean => currentState === "preview";

export function open(): void {
  currentState = "open";
}

export function close(): void {
  currentState = "idle";
}

export function togglePreview(): void {
  currentState = currentState === "preview" ? "idle" : "preview";
}

function initialState(): GalleryState {
  return Preferences.gallery.previewEnabled.value ? "preview" : "idle";
}
