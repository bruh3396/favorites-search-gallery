import * as FavoritesCommandBar from "@/features/favorites/view/shell/command_bar";
import * as FavoritesNativePageCleaner from "@/features/favorites/view/shell/native_page_cleaner";
import { Content, Root, ScrollSentinelBottom, ScrollSentinelTop } from "@/app/layout/shell";
import { insertStyle } from "@/utils/dom/injector";
import COMMAND_BAR_CSS from "@/assets/css/favorites/command_bar.css";
import DESKTOP_CSS from "@/assets/css/platform/desktop_base.css";
import DRAWER_CSS from "@/assets/css/favorites/drawer.css";
import DRAWER_PANELS_CSS from "@/assets/css/favorites/drawer_panels.css";
import { FavoritesId } from "@/features/favorites/types/scaffold";
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
}

function style(): void {
  insertStyle(DESKTOP_CSS + COMMAND_BAR_CSS + SEARCH_PILL_CSS + PAGINATION_CSS + DRAWER_CSS + DRAWER_PANELS_CSS, "favorites-menu");
  Body.insertAdjacentElement("afterbegin", FavoritesCommandBar.build());
}

function buildScaffold(): void {
  ContentColumn.append(ScrollSentinelTop, Content, ScrollSentinelBottom);
  ContentRow.append(DrawerTrack, ContentColumn);
  Body.append(ContentRow);
  Root.prepend(Body);
}
