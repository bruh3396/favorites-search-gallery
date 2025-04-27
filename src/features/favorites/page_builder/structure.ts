import {DESKTOP_HTML, FAVORITES_CONTENT_HTML, FAVORITES_HTML, MOBILE_HTML} from "../../../assets/html";
import {insertHTMLAndExtractStyle, insertStyleHTML} from "../../../utils/dom/style";
import {FAVORITES_SEARCH_GALLERY_CONTAINER} from "../../../lib/structure/container";
import {ON_MOBILE_DEVICE} from "../../../lib/functional/flags";

export const FAVORITES_CONTENT_CONTAINER = document.createElement("div");

FAVORITES_CONTENT_CONTAINER.id = "favorites-search-gallery-content";

export function insertFavoritesMenu(): void {
  insertStyleHTML(ON_MOBILE_DEVICE ? MOBILE_HTML : DESKTOP_HTML, "favorites-menu-style");
  insertHTMLAndExtractStyle(FAVORITES_SEARCH_GALLERY_CONTAINER, "afterbegin", FAVORITES_HTML);
}

export function insertFavoritesContentContainer(): void {
  insertStyleHTML(FAVORITES_CONTENT_HTML);
  FAVORITES_SEARCH_GALLERY_CONTAINER.insertAdjacentElement("beforeend", FAVORITES_CONTENT_CONTAINER);
}
