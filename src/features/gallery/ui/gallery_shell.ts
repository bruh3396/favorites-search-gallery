import { GALLERY_HTML } from "../../../assets/html";
import { OVERLAYS } from "../../../lib/shell";
import { insertStyleHTML } from "../../../utils/dom/injector";

export const GALLERY_ROOT = document.createElement("div");
GALLERY_ROOT.id = "gallery-container";
toggleGalleryVisibility(false);

export function insertGalleryContainer(): void {
  insertStyleHTML(GALLERY_HTML);
  OVERLAYS.insertAdjacentElement("beforeend", GALLERY_ROOT);
}

export function toggleGalleryVisibility(value: boolean): void {
  GALLERY_ROOT.style.visibility = value ? "" : "hidden";
}
