import { DESKTOP_HTML, FAVORITES_HTML, MOBILE_HTML } from "../../../../assets/html";
import { ON_DESKTOP_DEVICE, ON_MOBILE_DEVICE } from "../../../../lib/globals/flags";
import { createFooter, moveStatusToFooter } from "./favorites_mobile_footer";
import { insertHTMLAndExtractStyle, insertStyleHTML } from "../../../../utils/dom/style";
import { FAVORITES_SEARCH_GALLERY_CONTAINER } from "../../../../lib/globals/container";
import { createControlsGuide } from "./favorites_mobile_control_guide";
import { createDynamicFavoritesDesktopMenuElements } from "../components/dynamic/favorites_desktop_dynamic_elements";
import { createDynamicFavoritesMobileMenuElements } from "../components/dynamic/favorites_mobile_dynamic_elements";
import { createStaticFavoritesMenuElements } from "../components/static/favorites_menu_static_element_creator";

export function buildFavoritesMenu(): void {
  insertFavoritesMenuHTML();

  if (ON_DESKTOP_DEVICE) {
    buildDesktopFavoritesMenu();
  } else {
    buildMobileFavoritesMenu();
  }
  createStaticFavoritesMenuElements();
}

function insertFavoritesMenuHTML(): void {
  insertStyleHTML(ON_MOBILE_DEVICE ? MOBILE_HTML : DESKTOP_HTML, "favorites-menu-style");
  insertHTMLAndExtractStyle(FAVORITES_SEARCH_GALLERY_CONTAINER, "afterbegin", FAVORITES_HTML);
}

function buildDesktopFavoritesMenu(): void {
  createDynamicFavoritesDesktopMenuElements();
}

function buildMobileFavoritesMenu(): void {
  createFooter();
  moveStatusToFooter();
  createControlsGuide();
  createDynamicFavoritesMobileMenuElements();
}
