import { toggleDataset } from "@/utils/dom/attribute";

export function toggleDisplay(element: HTMLElement | null, visible: boolean): void {
  toggleDataset(element, "hidden", !visible);
}

export function toggleHeader(value: boolean): void {
  toggleDisplay(document.getElementById("header"), value);
}

export function toggleGalleryMenuEnabled(value: boolean): void {
  toggleDataset(document.documentElement, "galleryMenuHidden", !value);
}
