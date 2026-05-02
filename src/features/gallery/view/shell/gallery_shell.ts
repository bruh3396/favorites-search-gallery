import { Overlays } from "../../../../lib/shell";

export const galleryRoot = document.createElement("div");
galleryRoot.id = "gallery-container";
toggleGalleryVisibility(false);

export function mountGallery(): void {
  Overlays.insertAdjacentElement("beforeend", galleryRoot);
}

export function toggleGalleryVisibility(value: boolean): void {
  galleryRoot.style.visibility = value ? "" : "hidden";
}
