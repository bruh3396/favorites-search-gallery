import * as FavoritesCommandBar from "@/features/favorites/view/shell/command_bar";
import * as FavoritesMobileFooter from "@/features/favorites/view/shell/mobile_footer";
import * as FavoritesNativePageCleaner from "@/features/favorites/view/shell/native_page_cleaner";
import { Body, Root } from "@/app/layout/shell";
import { ON_DESKTOP_DEVICE, ON_FIRST_FAVORITES_PAGE } from "@/lib/environment";
import { insertHtml, insertStyle } from "@/utils/dom/injector";
import COMMAND_BAR_CSS from "@/assets/css/favorites/favorites_command_bar.css";
import DESKTOP_CSS from "@/assets/css/platform/desktop_base.css";
import DRAWER_CSS from "@/assets/css/favorites/favorites_drawer.css";
import DRAWER_PANELS_CSS from "@/assets/css/favorites/favorites_drawer_panels.css";
import FAVORITES_CSS from "@/assets/css/favorites/favorites.css";
import FAVORITES_MOBILE_HTML from "@/assets/html/favorites.html";
import MOBILE_CSS from "@/assets/css/platform/mobile.css";
import PAGINATION_CSS from "@/assets/css/favorites/favorites_pagination.css";
import SEARCH_PILL_CSS from "@/assets/css/favorites/favorites_search_pill.css";
import { buildControlsGuide } from "@/features/favorites/view/shell/mobile_control_guide";
import { setupFavoritesHelpBar } from "@/features/favorites/view/shell/help_bar";

export function setup(onFirstPageFavoritesExtracted: (elements: HTMLElement[] | undefined) => void): void {
  FavoritesNativePageCleaner.removeUnusedScripts();
  const favorites = FavoritesNativePageCleaner.extractNativeFavorites();

  onFirstPageFavoritesExtracted(ON_FIRST_FAVORITES_PAGE ? favorites : undefined);

  if (ON_DESKTOP_DEVICE) {
    insertStyle(DESKTOP_CSS + COMMAND_BAR_CSS + SEARCH_PILL_CSS + PAGINATION_CSS + DRAWER_CSS + DRAWER_PANELS_CSS, "favorites-menu");
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
