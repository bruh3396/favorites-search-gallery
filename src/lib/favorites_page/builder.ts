import {DESKTOP_HTML, FAVORITES_HTML, MOBILE_HTML} from "../../assets/html";
import {FAVORITES_SEARCH_GALLERY_CONTAINER} from "./container";
import {ON_MOBILE_DEVICE} from "../functional/flags";
import {insertStyleHTML} from "../../utils/dom/style";
import {setupSearchBox} from "./search_box";

function insertFavoritesMenu(): void {
  insertStyleHTML(ON_MOBILE_DEVICE ? MOBILE_HTML : DESKTOP_HTML, "favorites-menu-style");
  FAVORITES_SEARCH_GALLERY_CONTAINER.insertAdjacentHTML("afterbegin", FAVORITES_HTML);
}

export function buildFavoritesPage(): void {
  insertFavoritesMenu();
  setupSearchBox();
}
