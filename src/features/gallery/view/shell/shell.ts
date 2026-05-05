import { Overlays } from "../../../../lib/shell";

export const GalleryRoot = document.createElement("div");
GalleryRoot.id = "gallery-container";
toggleGalleryVisibility(false);

export function mountGallery(): void {
  Overlays.insertAdjacentElement("beforeend", GalleryRoot);
}

export function toggleGalleryVisibility(value: boolean): void {
  GalleryRoot.style.visibility = value ? "" : "hidden";
}
