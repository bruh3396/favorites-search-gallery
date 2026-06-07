import * as FavoritesCommandBar from "@/features/favorites/view/shell/command_bar";
import * as FavoritesHelpBar from "@/features/favorites/view/shell/mobile/help_bar";
import * as FavoritesMobileControlGuide from "@/features/favorites/view/shell/mobile/control_guide";
import * as FavoritesMobileFooter from "@/features/favorites/view/shell/mobile/footer";
import * as FavoritesNativePageCleaner from "@/features/favorites/view/shell/native_page_cleaner";
import { Content, Root, ScrollSentinelBottom, ScrollSentinelTop } from "@/app/layout/shell";
import { ON_DESKTOP_DEVICE, ON_MOBILE_DEVICE } from "@/lib/environment";
import { insertHtml, insertStyle } from "@/utils/dom/injector";
import COMMAND_BAR_CSS from "@/assets/css/favorites/command_bar.css";
import DESKTOP_CSS from "@/assets/css/platform/desktop_base.css";
import DRAWER_CSS from "@/assets/css/favorites/drawer.css";
import DRAWER_PANELS_CSS from "@/assets/css/favorites/drawer_panels.css";
import FAVORITES_CSS from "@/assets/css/favorites/favorites.css";
import FAVORITES_MOBILE_HTML from "@/assets/html/favorites.html";
import { FavoritesId } from "@/features/favorites/types/scaffold";
import MOBILE_CSS from "@/assets/css/platform/mobile.css";
import PAGINATION_CSS from "@/assets/css/favorites/pagination.css";
import SEARCH_PILL_CSS from "@/assets/css/favorites/search_pill.css";
import { div } from "@/utils/dom/element";

export const Body = div(FavoritesId.body);
export const DrawerTrack = div(FavoritesId.drawerTrack);
const ContentRow = div(FavoritesId.contentRow);
const ContentColumn = div(FavoritesId.contentColumn);

export function setup(onFirstPageFavoritesExtracted: (elements: HTMLElement[] | undefined) => void): void {
  onFirstPageFavoritesExtracted(FavoritesNativePageCleaner.extractNativeFavorites());

  buildScaffold();
  FavoritesNativePageCleaner.removeUnusedScripts();
  style();

  if (ON_MOBILE_DEVICE) {
    FavoritesHelpBar.setup();
    FavoritesMobileFooter.buildMobileFooter();
    FavoritesMobileControlGuide.setup();
  }
}

function style(): void {
  if (ON_DESKTOP_DEVICE) {
    insertStyle(DESKTOP_CSS + COMMAND_BAR_CSS + SEARCH_PILL_CSS + PAGINATION_CSS + DRAWER_CSS + DRAWER_PANELS_CSS, "favorites-menu");
    Body.insertAdjacentElement("afterbegin", FavoritesCommandBar.build());
  } else {
    insertStyle(MOBILE_CSS + FAVORITES_CSS, "favorites-menu");
    insertHtml(Root, "afterbegin", FAVORITES_MOBILE_HTML);
  }
}

function buildScaffold(): void {
  ContentColumn.append(ScrollSentinelTop, Content, ScrollSentinelBottom);
  ContentRow.append(DrawerTrack, ContentColumn);
  Body.append(ContentRow);
  Root.prepend(Body);
}
