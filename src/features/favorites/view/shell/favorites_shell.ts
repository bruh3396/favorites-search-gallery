import DESKTOP_CSS from "../../../../assets/css/desktop/base.css";
import FAVORITES_CSS from "../../../../assets/css/favorites.css";
import FAVORITES_HTML from "../../../../assets/html/favorites.html";
import MOBILE_CSS from "../../../../assets/css/mobile.css";
import { ON_DESKTOP_DEVICE, ON_MOBILE_DEVICE } from "../../../../lib/environment/environment";
import { insertHTML, insertStyle } from "../../../../lib/dom/injector";
import { Root } from "../../../../lib/shell";
import { buildControlsGuide } from "./mobile_control_guide";
import { buildMobileFooter } from "./mobile_footer";
import { cleanNativeFavoritesPage } from "./native_page_cleaner";
import { setupFavoritesHelpBar } from "./help_bar";

export function setupFavoritesShell(): void {
  cleanNativeFavoritesPage();
  insertStyle((ON_MOBILE_DEVICE ? MOBILE_CSS : DESKTOP_CSS) + FAVORITES_CSS, "favorites-menu");
  insertHTML(Root, "afterbegin", FAVORITES_HTML);
  setupFavoritesHelpBar();

  if (!ON_DESKTOP_DEVICE) {
    buildMobileFooter();
    buildControlsGuide();
  }
}
