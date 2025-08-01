import { FAVORITES_SEARCH_GALLERY_CONTAINER } from "../../../lib/global/container";
import { GALLERY_HTML } from "../../../assets/html";
import { insertStyleHTML } from "../../../utils/dom/style";

export const GALLERY_CONTAINER = document.createElement("div");
GALLERY_CONTAINER.id = "gallery-container";
GALLERY_CONTAINER.style.display = "none";

export function insertGalleryContainer(): void {
  insertStyleHTML(GALLERY_HTML);
  FAVORITES_SEARCH_GALLERY_CONTAINER.insertAdjacentElement("beforeend", GALLERY_CONTAINER);
}
