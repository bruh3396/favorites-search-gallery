import { FavoritesDrawerTab } from "@/types/ui";
import { IconName } from "@/lib/ui/icon";

export const FavoritesMenuId = {
  commandBar: "favorites-command-bar",
  grid: "favorites-command-bar-grid",
  searchBox: "favorites-search-box",
  status: "favorites-search-status",
  matchCount: "match-count-label",
  loadStatus: "favorites-load-status-label",
  pill: "favorites-pill",
  searchButton: "favorites-search-button",
  panelButton: "panel-button",
  drawerToggleSlot: "favorites-drawer-toggle-slot",
  actions: "favorites-search-actions",
  paginationSlot: "favorites-pagination-slot",
  resetSlot: "favorites-reset-slot",
  drawer: "favorites-drawer",
  drawerTabStrip: "favorites-drawer-tabs",
  drawerTabPanels: "favorites-drawer-panels"
} as const;

export const FavoritesMenuClass = {
  drawerTab: "favorites-drawer-tab",
  drawerTabLabel: "favorites-drawer-tab-label",
  drawerPanel: "favorites-drawer-panel",
  drawerSection: "favorites-drawer-section",
  drawerSectionTitle: "favorites-drawer-section-title",
  drawerHelpLinks: "favorites-drawer-help-links",
  drawerHelpLink: "favorites-drawer-help-link"
} as const;

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
