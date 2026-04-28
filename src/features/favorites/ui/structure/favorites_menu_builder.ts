import { DESKTOP_CSS, MOBILE_CSS } from "../../../../assets/css";
import { ON_DESKTOP_DEVICE, ON_MOBILE_DEVICE } from "../../../../lib/environment/environment";
import { createFooter, moveStatusToFooter } from "./favorites_mobile_footer";
import { insertHTMLAndExtractStyle, insertStyle } from "../../../../utils/dom/injector";
import { FAVORITES_HTML } from "../../../../assets/html";
import { ROOT } from "../../../../lib/shell";
import { createControlsGuide } from "./favorites_mobile_control_guide";
import { createDynamicFavoritesDesktopMenuElements } from "../components/dynamic/favorites_desktop_dynamic_elements";
import { createDynamicFavoritesMobileMenuElements } from "../components/dynamic/favorites_mobile_dynamic_elements";
import { createStaticFavoritesMenuElements } from "../components/static/favorites_menu_static_element_creator";

export function buildFavoritesMenu(): void {
  insertStyle(ON_MOBILE_DEVICE ? MOBILE_CSS : DESKTOP_CSS, "favorites-menu-style");
  insertFavoritesMenuHTML();

  if (ON_DESKTOP_DEVICE) {
    buildDesktopFavoritesMenu();
  } else {
    buildMobileFavoritesMenu();
  }
  createStaticFavoritesMenuElements();
}

function insertFavoritesMenuHTML(): void {
  insertHTMLAndExtractStyle(ROOT, "afterbegin", FAVORITES_HTML);
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
