import * as FavoritesToolbar from "@/features/favorites/view/shell/toolbar";
import { Content, Root, ScrollSentinelBottom, ScrollSentinelTop } from "@/app/layout/shell";
import DESKTOP_CSS from "@/assets/css/platform/desktop_base.css";
import DRAWER_CSS from "@/assets/css/favorites/drawer.css";
import DRAWER_PANELS_CSS from "@/assets/css/favorites/drawer_panels.css";
import { FavoritesId } from "@/features/favorites/types/scaffold";
import PAGINATION_CSS from "@/assets/css/favorites/pagination.css";
import SEARCH_FIELD_CSS from "@/assets/css/favorites/search_field.css";
import SETTINGS_PANEL_CSS from "@/assets/css/favorites/settings_panel.css";
import TOOLBAR_CSS from "@/assets/css/favorites/toolbar.css";
import { div } from "@/utils/dom/element_factory";
import { insertStyle } from "@/utils/dom/injector";

export const FavoritesRoot = div(FavoritesId.root);
export const FavoritesWorkspace = div(FavoritesId.workspace);
export const FavoritesDrawerTrack = div(FavoritesId.drawerTrack);
export const FavoritesContentPane = div(FavoritesId.contentPane);

export function setup(): void {
  Root.prepend(FavoritesRoot);
  FavoritesRoot.append(FavoritesToolbar.build());
  FavoritesRoot.append(FavoritesWorkspace);
  FavoritesWorkspace.append(FavoritesDrawerTrack, FavoritesContentPane);
  FavoritesContentPane.append(ScrollSentinelTop, Content, ScrollSentinelBottom);
  insertStyle(DESKTOP_CSS + TOOLBAR_CSS + SEARCH_FIELD_CSS + PAGINATION_CSS + DRAWER_CSS + DRAWER_PANELS_CSS + SETTINGS_PANEL_CSS, "favorites-ui");
}
