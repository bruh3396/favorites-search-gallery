import * as FavoritesToolbar from "@/features/favorites/view/shell/toolbar";
import { Content, Root, ScrollSentinelBottom, ScrollSentinelTop } from "@/app/layout/shell";
import DESKTOP_CSS from "@/assets/css/platform/desktop_base.css";
import DRAWER_CSS from "@/assets/css/favorites/drawer.css";
import DRAWER_PANELS_CSS from "@/assets/css/favorites/drawer_panels.css";
import { FavoritesId } from "@/features/favorites/types/scaffold";
import PAGINATION_CSS from "@/assets/css/favorites/pagination.css";
import SEARCH_FIELD_CSS from "@/assets/css/favorites/search_field.css";
import TOOLBAR_CSS from "@/assets/css/favorites/toolbar.css";
import { div } from "@/utils/dom/element";
import { insertStyle } from "@/utils/dom/injector";

export const Body = div(FavoritesId.body);
export const DrawerTrack = div(FavoritesId.drawerTrack);
const ContentRow = div(FavoritesId.contentRow);
const ContentColumn = div(FavoritesId.contentColumn);

export function setup(): void {
  buildScaffold();
  insertStyle(DESKTOP_CSS + TOOLBAR_CSS + SEARCH_FIELD_CSS + PAGINATION_CSS + DRAWER_CSS + DRAWER_PANELS_CSS, "favorites-ui");
  Body.insertAdjacentElement("afterbegin", FavoritesToolbar.build());
}

function buildScaffold(): void {
  ContentColumn.append(ScrollSentinelTop, Content, ScrollSentinelBottom);
  ContentRow.append(DrawerTrack, ContentColumn);
  Body.append(ContentRow);
  Root.prepend(Body);
}
