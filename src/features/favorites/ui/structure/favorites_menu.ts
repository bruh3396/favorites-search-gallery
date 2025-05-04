import { DESKTOP_HTML, FAVORITES_HTML, MOBILE_HTML } from "../../../../assets/html";
import { insertHTMLAndExtractStyle, insertStyleHTML } from "../../../../utils/dom/style";
import { FAVORITES_SEARCH_GALLERY_CONTAINER } from "../../../../lib/globals/container";
import { ON_MOBILE_DEVICE } from "../../../../lib/globals/flags";

export function insertFavoritesMenu(): void {
  insertStyleHTML(ON_MOBILE_DEVICE ? MOBILE_HTML : DESKTOP_HTML, "favorites-menu-style");
  insertHTMLAndExtractStyle(FAVORITES_SEARCH_GALLERY_CONTAINER, "afterbegin", FAVORITES_HTML);
}
