export const FavoritesMenuId = {
  menu: "favorites-search-gallery-menu",
  bar: "favorites-menu-bar",
  status: "favorites-menu-status",
  matchCount: "match-count-label",
  loadStatus: "favorites-load-status-label",
  pill: "favorites-menu-pill",
  searchButton: "favorites-menu-search-button",
  panelButton: "panel-button",
  settingsSlot: "favorites-menu-panel-button-slot",
  actions: "favorites-menu-actions",
  paginationSlot: "favorites-pagination-slot",
  drawer: "favorites-menu-drawer",
  drawerTabStrip: "favorites-menu-drawer-tabs",
  drawerTabPanels: "favorites-menu-drawer-panels"
} as const;

export type FavoritesDrawerTab = "settings" | "saved" | "tags" | "download";

export const favoritesDrawerTabs: { tab: FavoritesDrawerTab; label: string }[] = [
  { tab: "settings", label: "Settings" },
  { tab: "saved", label: "Saved" },
  { tab: "tags", label: "Tags" },
  { tab: "download", label: "Download" }
];
