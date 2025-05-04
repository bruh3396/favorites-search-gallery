import { FAVORITES_CONTENT_HTML } from "../../../../assets/html";
import { FAVORITES_SEARCH_GALLERY_CONTAINER } from "../../../../lib/globals/container";
import { insertStyleHTML } from "../../../../utils/dom/style";

export const FAVORITES_CONTENT_CONTAINER = document.createElement("div");

FAVORITES_CONTENT_CONTAINER.id = "favorites-search-gallery-content";

export function insertFavoritesContentContainer(): void {
  insertStyleHTML(FAVORITES_CONTENT_HTML);
  FAVORITES_SEARCH_GALLERY_CONTAINER.insertAdjacentElement("beforeend", FAVORITES_CONTENT_CONTAINER);
}
