import { IconName } from "@/lib/ui/icon";

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

export const FavoritesMenuClass = {
  drawerTab: "favorites-menu-drawer-tab",
  drawerTabLabel: "favorites-menu-drawer-tab-label",
  drawerPanel: "favorites-menu-drawer-panel",
  drawerSection: "favorites-menu-drawer-section",
  drawerSectionTitle: "favorites-menu-drawer-section-title",
  drawerHelpLinks: "favorites-menu-drawer-help-links",
  drawerHelpLink: "favorites-menu-drawer-help-link"
} as const;

export type FavoritesDrawerTab = "settings" | "saved" | "tags" | "download" | "new" | "help";

export const favoritesDrawerTabs: { tab: FavoritesDrawerTab; label: string; icon: IconName }[] = [
  { tab: "settings", label: "Settings", icon: "settings" },
  { tab: "saved", label: "Saved", icon: "bookmark" },
  { tab: "tags", label: "Tags", icon: "tag" },
  { tab: "download", label: "Download", icon: "download" },
  { tab: "new", label: "New", icon: "sparkles" },
  { tab: "help", label: "Help", icon: "help" }
];

export const favoritesHelpLinks: { label: string; href: string }[] = [
  { label: "Controls & Help", href: "https://github.com/bruh3396/favorites-search-gallery/#controls" },
  { label: "Report an Issue", href: "https://github.com/bruh3396/favorites-search-gallery/issues" }
];
