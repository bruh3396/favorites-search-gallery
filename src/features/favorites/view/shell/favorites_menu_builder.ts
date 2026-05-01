import { DESKTOP_CSS, MOBILE_CSS } from "../../../../assets/css";
import { ON_DESKTOP_DEVICE, ON_MOBILE_DEVICE } from "../../../../lib/environment/environment";
import { createFooter, moveStatusToFooter } from "./favorites_mobile_footer";
import { insertHtmlWithStyles, insertStyle } from "../../../../utils/dom/injector";
import { FAVORITES_HTML } from "../../../../assets/html";
import { ROOT } from "../../../../lib/shell";
import { createControlsGuide } from "./favorites_mobile_control_guide";
import { createFavoritesDesktopMenuElements } from "../../control/components/favorites_desktop_dynamic_elements";
import { createFavoritesMobileMenuElements } from "../../control/components/favorites_mobile_dynamic_elements";
import { insertFavoritesFinder } from "../../control/components/favorites_finder";
import { insertFavoritesHelpBar } from "./favorites_help_bar";
import { insertFavoritesRatingFilter } from "../../control/components/favorites_rating_filter";
import { setupFavoritesSearchBox } from "../../control/search_box/favorites_search_box";

export function buildFavoritesMenu(): void {
  insertStyle(ON_MOBILE_DEVICE ? MOBILE_CSS : DESKTOP_CSS, "favorites-menu-style");
  insertMenu();
  populateMenu();
}

function insertMenu(): void {
  insertHtmlWithStyles(ROOT, "afterbegin", FAVORITES_HTML);
}

function populateMenu(): void {
  insertFavoritesFinder();
  insertFavoritesHelpBar();
  insertFavoritesRatingFilter();
  setupFavoritesSearchBox();

  if (ON_DESKTOP_DEVICE) {
    createFavoritesDesktopMenuElements();
  } else {
    createFooter();
    moveStatusToFooter();
    createControlsGuide();
    createFavoritesMobileMenuElements();
  }
}
