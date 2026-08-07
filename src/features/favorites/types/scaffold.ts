import { FavoritesDrawerTab } from "@/types/app";
import { IconName } from "@/lib/ui/icon";

export const FavoritesId = {
  body: "favorites-body",
  drawerTrack: "favorites-drawer-track",
  contentRow: "favorites-content-row",
  contentColumn: "favorites-content-column",
  toolbar: "favorites-toolbar",
  grid: "favorites-toolbar-grid",
  brandSlot: "favorites-brand-slot",
  brandVersion: "favorites-brand-version",
  searchBox: "favorites-search-box",
  status: "favorites-search-status",
  matchCount: "match-count-label",
  loadStatus: "favorites-load-status-label",
  searchField: "favorites-search-field",
  searchButton: "favorites-search-button",
  panelButton: "panel-button",
  drawerToggleSlot: "favorites-drawer-toggle-slot",
  actions: "favorites-search-actions",
  paginationSlot: "favorites-pagination-slot",
  buttonsSlot: "favorites-button-slot",
  drawer: "favorites-drawer",
  drawerTabStrip: "favorites-drawer-tabs",
  drawerBody: "favorites-drawer-body",
  drawerTitle: "favorites-drawer-title",
  drawerTabPanels: "favorites-drawer-panels"
} as const;

export const FavoritesClass = {
  drawerTab: "favorites-drawer-tab",
  drawerTabLabel: "favorites-drawer-tab-label",
  drawerPanel: "favorites-drawer-panel",
  drawerSection: "favorites-drawer-section",
  drawerSectionTitle: "favorites-drawer-section-title",
  drawerHelpLinks: "favorites-drawer-help-links",
  drawerHelpLink: "favorites-drawer-help-link"
} as const;

export const FavoritesDrawerTabs: { tab: FavoritesDrawerTab; label: string; title?: string; icon: IconName }[] = [
  { tab: "settings", label: "Settings", icon: "settings" },
  { tab: "saved", label: "Saved", title: "Saved Searches", icon: "bookmark" },
  { tab: "tags", label: "Tags", title: "Edit Tags", icon: "tag" },
  { tab: "download", label: "Download", title: "Download Favorites", icon: "download" },
  { tab: "change", label: "Changelog", icon: "changelog" },
  { tab: "help", label: "Help", title: "Help & Support", icon: "help" }
];

export const FavoritesHelpLinks: { label: string; href: string }[] = [
  { label: "Controls & Help", href: "https://github.com/bruh3396/favorites-search-gallery/#controls" },
  { label: "Report an Issue", href: "https://github.com/bruh3396/favorites-search-gallery/issues" }
];
