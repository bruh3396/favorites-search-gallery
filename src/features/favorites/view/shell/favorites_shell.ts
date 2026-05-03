import { DESKTOP_CSS, MOBILE_CSS } from "../../../../assets/css";
import { ON_DESKTOP_DEVICE, ON_MOBILE_DEVICE } from "../../../../lib/environment/environment";
import { insertHtmlWithStyles, insertStyle } from "../../../../utils/dom/injector";
import { FAVORITES_HTML } from "../../../../assets/html";
import { Root } from "../../../../lib/shell";
import { buildControlsGuide } from "./favorites_mobile_control_guide";
import { buildFavoritesDesktopMenuElements } from "../../control/components/favorites_desktop_dynamic_elements";
import { buildFavoritesMobileMenuElements } from "../../control/components/favorites_mobile_dynamic_elements";
import { buildMobileFooter } from "./favorites_mobile_footer";
import { cleanNativeFavoritesPage } from "./favorites_page_cleaner";
import { setupFavoritesBottomNavigationButtons } from "../../control/components/favorites_bottom_navigation_buttons";
import { setupFavoritesFinder } from "../../control/components/favorites_finder";
import { setupFavoritesHelpBar } from "./favorites_help_bar";
import { setupFavoritesRatingFilter } from "../../control/components/favorites_rating_filter";
import { setupFavoritesSearchBox } from "../../control/search_box/favorites_search_box";

export function setupFavoritesShell(): void {
  cleanNativeFavoritesPage();
  setupFavoritesBottomNavigationButtons();
  insertStyle(ON_MOBILE_DEVICE ? MOBILE_CSS : DESKTOP_CSS, "favorites-menu");
  insertHtmlWithStyles(Root, "afterbegin", FAVORITES_HTML);
  setupFavoritesFinder();
  setupFavoritesHelpBar();
  setupFavoritesRatingFilter();
  setupFavoritesSearchBox();

  if (ON_DESKTOP_DEVICE) {
    buildFavoritesDesktopMenuElements();
  } else {
    buildMobileFooter();
    buildControlsGuide();
    buildFavoritesMobileMenuElements();
  }
}
