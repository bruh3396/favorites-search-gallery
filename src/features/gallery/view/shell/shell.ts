import { Overlays } from "../../../../app/shell/shell";

export const GalleryRoot = document.createElement("div");
GalleryRoot.id = "gallery-container";

export function mountGallery(): void {
  Overlays.insertAdjacentElement("beforeend", GalleryRoot);
}
