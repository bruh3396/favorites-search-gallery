import {FAVORITES_CONTENT_HTML} from "../../../../assets/html";
import {FAVORITES_SEARCH_GALLERY_CONTAINER} from "../../../../lib/structure/container";
// import {FavoritesSettings} from "../../../config/favorites_settings";
// import {MainSidebar} from "./sidebar";
import {insertStyleHTML} from "../../../../utils/dom/style";

export const FAVORITES_CONTENT_CONTAINER = document.createElement("div");

FAVORITES_CONTENT_CONTAINER.id = "favorites-search-gallery-content";

// export function insertFavoritesContentContainer(): void {
//   const container = FavoritesSettings.useSidebar ? MainSidebar.contentContainer : FAVORITES_SEARCH_GALLERY_CONTAINER;

//   insertStyleHTML(FAVORITES_CONTENT_HTML);
//   container.insertAdjacentElement("beforeend", FAVORITES_CONTENT_CONTAINER);
// }

export function insertFavoritesContentContainer(): void {
  insertStyleHTML(FAVORITES_CONTENT_HTML);
  FAVORITES_SEARCH_GALLERY_CONTAINER.insertAdjacentElement("beforeend", FAVORITES_CONTENT_CONTAINER);
}
