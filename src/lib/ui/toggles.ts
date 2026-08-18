import { toggleDataset } from "@/utils/platform/dataset";

export function toggleDisplay(element: HTMLElement | null, visible: boolean): void {
  toggleDataset(element, "hidden", !visible);
}

export function toggleHeader(value: boolean): void {
  toggleDisplay(document.getElementById("header"), value);
}

export function toggleGalleryMenuEnabled(value: boolean): void {
  toggleDataset(document.documentElement, "galleryMenuHidden", !value);
}

export function toggleNativeFont(value: boolean): void {
  toggleDataset(document.documentElement, "nativeFont", value);
}

export function toggleThemedGalleryBackground(value: boolean): void {
  toggleDataset(document.documentElement, "themedGalleryBackground", value);
}
