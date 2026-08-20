import { FavoritesDrawerView } from "@/types/favorite";
import { IconName } from "@/lib/ui/icon";

export type FavoritesDrawerViewDescriptor = {
  name: FavoritesDrawerView;
  label: string;
  title?: string;
  icon: IconName;
};

export const FavoritesId = {
  root: "favorites-root",
  toolbar: "favorites-toolbar",
  workspace: "favorites-workspace",
  drawerTrack: "favorites-drawer-track",
  contentPane: "favorites-content-pane",
  toolbarGrid: "favorites-toolbar-grid",
  aboutSlot: "favorites-about-slot",
  aboutVersion: "favorites-about-version",
  aboutHelp: "favorites-about-help",
  searchBox: "favorites-search-box",
  status: "favorites-search-status",
  resultsCount: "results-count-label",
  loadStatus: "favorites-load-status-label",
  loadProgressBar: "favorites-load-progress-bar",
  searchField: "favorites-search-field",
  searchButton: "favorites-search-button",
  drawerToggleSlot: "favorites-drawer-toggle-slot",
  drawerToggleButton: "favorites-drawer-toggle-button",
  actions: "favorites-search-actions",
  clearButton: "clear-button",
  paginationSlot: "favorites-pagination-slot",
  buttonsSlot: "favorites-button-slot",
  drawer: "favorites-drawer",
  drawerSidebar: "favorites-drawer-sidebar",
  drawerViews: "favorites-drawer-views"
} as const;

export const FavoritesClass = {
  drawerSidebarIcon: "favorites-drawer-sidebar-icon",
  drawerSidebarIconLabel: "favorites-drawer-sidebar-icon-label",
  drawerView: "favorites-drawer-view",
  drawerTitle: "favorites-drawer-title",
  drawerTitleLabel: "favorites-drawer-title-label",
  drawerTitleAction: "favorites-drawer-title-action",
  drawerPanel: "favorites-drawer-panel",
  drawerSection: "favorites-drawer-section",
  drawerSectionTitle: "favorites-drawer-section-title",
  drawerHelpLinks: "favorites-drawer-help-links",
  drawerHelpLink: "favorites-drawer-help-link"
} as const;

export const FavoritesDrawerViews: FavoritesDrawerViewDescriptor[] = [
  { name: "settings", label: "Settings", icon: "settings" },
  { name: "download", label: "Download", title: "Download", icon: "download" },
  { name: "snippets", label: "Snippets", icon: "snippet" },
  { name: "tags", label: "Tags", title: "Edit Tags", icon: "tag" },
  { name: "change", label: "Changelog", icon: "changelog" },
  { name: "help", label: "Help", title: "Help", icon: "help" }
];

export const FavoritesHelpLinks: { label: string; href: string }[] = [
  { label: "Controls", href: "https://github.com/bruh3396/favorites-search-gallery/#controls" },
  { label: "Search Syntax", href: "https://github.com/bruh3396/favorites-search-gallery/#search-syntax" },
  { label: "Report an Issue", href: "https://github.com/bruh3396/favorites-search-gallery/issues" }
];

export function favoritesDrawerSidebarIconId(view: FavoritesDrawerView): string {
  return `${FavoritesClass.drawerSidebarIcon}-${view}`;
}

export function favoritesDrawerViewId(view: FavoritesDrawerView): string {
  return `${FavoritesClass.drawerView}-${view}`;
}
