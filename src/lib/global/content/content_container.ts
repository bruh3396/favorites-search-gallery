import { CONTENT_HTML } from "../../../assets/html";
import { FAVORITES_SEARCH_GALLERY_CONTAINER } from "../container";
import { insertStyleHTML } from "../../../utils/dom/style";

export const CONTENT_CONTAINER = document.createElement("div");

CONTENT_CONTAINER.id = "favorites-search-gallery-content";

export function insertFavoritesSearchGalleryContentContainer(): void {
  insertStyleHTML(CONTENT_HTML);
  FAVORITES_SEARCH_GALLERY_CONTAINER.insertAdjacentElement("beforeend", CONTENT_CONTAINER);
}
