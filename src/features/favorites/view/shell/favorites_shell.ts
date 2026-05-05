import { DESKTOP_CSS, MOBILE_CSS } from "../../../../assets/css";
import { ON_DESKTOP_DEVICE, ON_MOBILE_DEVICE } from "../../../../lib/environment/environment";
import { insertHtmlWithStyles, insertStyle } from "../../../../lib/dom/injector";
import { FAVORITES_HTML } from "../../../../assets/html";
import { Root } from "../../../../lib/shell";
import { buildControlsGuide } from "./favorites_mobile_control_guide";
import { buildMobileFooter } from "./favorites_mobile_footer";
import { cleanNativeFavoritesPage } from "./favorites_page_cleaner";
import { setupFavoritesHelpBar } from "./favorites_help_bar";

export function setupFavoritesShell(): void {
  cleanNativeFavoritesPage();
  insertStyle(ON_MOBILE_DEVICE ? MOBILE_CSS : DESKTOP_CSS, "favorites-menu");
  insertHtmlWithStyles(Root, "afterbegin", FAVORITES_HTML);
  setupFavoritesHelpBar();

  if (!ON_DESKTOP_DEVICE) {
    buildMobileFooter();
    buildControlsGuide();
  }
}
