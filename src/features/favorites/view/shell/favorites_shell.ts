import { DESKTOP_CSS, MOBILE_CSS } from "../../../../assets/css";
import { ON_DESKTOP_DEVICE, ON_MOBILE_DEVICE } from "../../../../lib/environment/environment";
import { insertHtmlWithStyles, insertStyle } from "../../../../lib/dom/injector";
import { FAVORITES_HTML } from "../../../../assets/html";
import { Root } from "../../../../lib/shell";
import { buildControlsGuide } from "./mobile_control_guide";
import { buildMobileFooter } from "./mobile_footer";
import { cleanNativeFavoritesPage } from "./native_page_cleaner";
import { setupFavoritesHelpBar } from "./help_bar";

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
