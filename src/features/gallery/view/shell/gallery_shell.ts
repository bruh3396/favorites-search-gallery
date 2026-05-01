import { OVERLAYS } from "../../../../lib/shell";

export const GALLERY_ROOT = document.createElement("div");
GALLERY_ROOT.id = "gallery-container";
toggleGalleryVisibility(false);

export function mountGallery(): void {
  OVERLAYS.insertAdjacentElement("beforeend", GALLERY_ROOT);
}

export function toggleGalleryVisibility(value: boolean): void {
  GALLERY_ROOT.style.visibility = value ? "" : "hidden";
}
