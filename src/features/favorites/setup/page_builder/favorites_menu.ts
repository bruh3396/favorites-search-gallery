import {DESKTOP_HTML, FAVORITES_HTML, MOBILE_HTML} from "../../../../assets/html";
import {insertHTMLAndExtractStyle, insertStyleHTML} from "../../../../utils/dom/style";
import {FAVORITES_SEARCH_GALLERY_CONTAINER} from "../../../../lib/structure/container";
// import {FavoritesSettings} from "../../../config/favorites_settings";
// import {MainSidebar} from "./sidebar";
import {ON_MOBILE_DEVICE} from "../../../../lib/functional/flags";

// export function insertFavoritesMenu(): void {
//   const container = FavoritesSettings.useSidebar ? MainSidebar.contentContainer : FAVORITES_SEARCH_GALLERY_CONTAINER;

//   insertStyleHTML(ON_MOBILE_DEVICE ? MOBILE_HTML : DESKTOP_HTML, "favorites-menu-style");
//   insertHTMLAndExtractStyle(container, "afterbegin", FAVORITES_HTML);
// }

export function insertFavoritesMenu(): void {
  insertStyleHTML(ON_MOBILE_DEVICE ? MOBILE_HTML : DESKTOP_HTML, "favorites-menu-style");
  insertHTMLAndExtractStyle(FAVORITES_SEARCH_GALLERY_CONTAINER, "afterbegin", FAVORITES_HTML);
}
