import * as FavoritesCommandBar from "@/features/favorites/view/shell/command_bar";
import * as FavoritesMobileFooter from "@/features/favorites/view/shell/mobile_footer";
import * as FavoritesNativePageCleaner from "@/features/favorites/view/shell/native_page_cleaner";
import { Body, Root } from "@/app/layout/shell";
import { ON_DESKTOP_DEVICE, ON_FIRST_FAVORITES_PAGE } from "@/lib/environment";
import { insertHtml, insertStyle } from "@/utils/dom/injector";
import DESKTOP_CSS from "@/assets/css/platform/desktop_base.css";
import FAVORITES_CSS from "@/assets/css/favorites/favorites.css";
import FAVORITES_MENU_CSS from "@/assets/css/favorites/favorites_menu.css";
import FAVORITES_MOBILE_HTML from "@/assets/html/favorites.html";
import MOBILE_CSS from "@/assets/css/platform/mobile.css";
import { buildControlsGuide } from "@/features/favorites/view/shell/mobile_control_guide";
import { setupFavoritesHelpBar } from "@/features/favorites/view/shell/help_bar";

export function setup(onFirstPageFavoritesExtracted: (elements: HTMLElement[] | undefined) => void): void {
  const favorites = FavoritesNativePageCleaner.extractFavorites();

  onFirstPageFavoritesExtracted(ON_FIRST_FAVORITES_PAGE ? favorites : undefined);

  if (ON_DESKTOP_DEVICE) {
    insertStyle(DESKTOP_CSS + FAVORITES_MENU_CSS, "favorites-menu");
    Body.insertAdjacentElement("afterbegin", FavoritesCommandBar.build());
  } else {
    insertStyle(MOBILE_CSS + FAVORITES_CSS, "favorites-menu");
    insertHtml(Root, "afterbegin", FAVORITES_MOBILE_HTML);
  }
  setupFavoritesHelpBar();

  if (!ON_DESKTOP_DEVICE) {
    FavoritesMobileFooter.buildMobileFooter();
    buildControlsGuide();
  }
}
