import { insertStyle } from "@/utils/dom/injector";
import { toggleDataset } from "@/utils/dom/attribute";

export function toggleHeader(value: boolean): void {
  insertStyle(`#header {display: ${value ? "block" : "none"}}`, "header");
}

export function toggleGalleryMenuEnabled(value: boolean): void {
  toggleDataset(document.documentElement, "galleryMenuHidden", !value);
}
