import { FAVORITES_SEARCH_GALLERY_CONTAINER } from "../../../../lib/globals/container";
import { GALLERY_HTML } from "../../../../assets/html";
import { insertStyleHTML } from "../../../../utils/dom/style";

export const GALLERY_CONTAINER = document.createElement("div");
GALLERY_CONTAINER.id = "gallery-container";

export function insertGalleryContainer(): void {
  insertStyleHTML(GALLERY_HTML);
  FAVORITES_SEARCH_GALLERY_CONTAINER.insertAdjacentElement("beforeend", GALLERY_CONTAINER);
}
