import { GalleryState } from "@/types/app";
import { Preferences } from "@/app/context/preferences";

let currentState = initialState();

export const getCurrentState = (): GalleryState => currentState;
export const isInGallery = (): boolean => currentState === "open";
export const isShowingPreviews = (): boolean => currentState === "preview";
export const isIdle = (): boolean => currentState === "idle";

export function open(): void {
  currentState = "open";
}

export function close(): void {
  currentState = "idle";
}

export function preview(value: boolean): void {
  currentState = currentState === "open" ? "open" : value ? "preview" : "idle";
}

function initialState(): GalleryState {
  return Preferences.gallery.previewEnabled.value ? "preview" : "idle";
}
