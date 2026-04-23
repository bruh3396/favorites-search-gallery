import { FAVORITES_SEARCH_GALLERY_ADDONS_CONTAINER } from "../../../lib/global/container";
import { GALLERY_HTML } from "../../../assets/html";
import { insertStyleHTML } from "../../../utils/dom/style";

export const GALLERY_CONTAINER = document.createElement("div");
GALLERY_CONTAINER.id = "gallery-container";
toggleGalleryVisibility(false);

export function insertGalleryContainer(): void {
  insertStyleHTML(GALLERY_HTML);
  FAVORITES_SEARCH_GALLERY_ADDONS_CONTAINER.insertAdjacentElement("beforeend", GALLERY_CONTAINER);
}

export function toggleGalleryVisibility(value: boolean): void {
  GALLERY_CONTAINER.style.visibility = value ? "" : "hidden";
}
