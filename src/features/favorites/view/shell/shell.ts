import * as FavoritesToolbar from "@/features/favorites/view/shell/toolbar";
import { Content, Root, ScrollSentinelBottom, ScrollSentinelTop } from "@/app/layout/shell";
import CHANGELOG_CSS from "@/assets/css/favorites/changelog.css";
import DRAWER_CSS from "@/assets/css/favorites/drawer.css";
import DRAWER_PANELS_CSS from "@/assets/css/favorites/drawer_panels.css";
import { FavoritesId } from "@/features/favorites/types/scaffold";
import HELP_CSS from "@/assets/css/favorites/help.css";
import PAGINATION_CSS from "@/assets/css/favorites/pagination.css";
import SEARCH_FIELD_CSS from "@/assets/css/favorites/search_field.css";
import SETTINGS_PANEL_CSS from "@/assets/css/favorites/settings_panel.css";
import SNIPPETS_CSS from "@/assets/css/favorites/snippets.css";
import TOOLBAR_CSS from "@/assets/css/favorites/toolbar.css";
import { div } from "@/utils/browser/factory";
import { insertStyle } from "@/utils/browser/injector";

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
  insertStyle(TOOLBAR_CSS + SEARCH_FIELD_CSS + PAGINATION_CSS + DRAWER_CSS + DRAWER_PANELS_CSS + SETTINGS_PANEL_CSS + SNIPPETS_CSS + HELP_CSS + CHANGELOG_CSS, "favorites-ui");
}
