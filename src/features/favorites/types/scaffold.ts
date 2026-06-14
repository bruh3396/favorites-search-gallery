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

export const SettingsClass = {
  section: "favorites-settings-section",
  sectionHeader: "favorites-settings-section-header",
  sectionTitle: "favorites-settings-section-title",
  groupWrap: "favorites-settings-group-wrap",
  group: "favorites-settings-group",
  row: "favorites-settings-row",
  rowLabel: "favorites-settings-row-label",
  control: "favorites-settings-control",
  toggleTrack: "favorites-settings-toggle-track",
  toggleKnob: "favorites-settings-toggle-knob",
  segmented: "favorites-settings-segmented",
  segmentedOption: "favorites-settings-segmented-option",
  dropdown: "favorites-settings-dropdown",
  dropdownButton: "favorites-settings-dropdown-button",
  dropdownMenu: "favorites-settings-dropdown-menu",
  dropdownOption: "favorites-settings-dropdown-option",
  stepper: "favorites-settings-stepper",
  stepperButton: "favorites-settings-stepper-button",
  stepperValue: "favorites-settings-stepper-value"
} as const;

export const FavoritesDrawerTabs: { tab: FavoritesDrawerTab; label: string; icon: IconName }[] = [
  { tab: "settings", label: "Settings", icon: "settings" },
  { tab: "saved", label: "Saved", icon: "bookmark" },
  { tab: "tags", label: "Tags", icon: "tag" },
  { tab: "download", label: "Download", icon: "download" },
  { tab: "change", label: "Changelog", icon: "changelog" },
  { tab: "help", label: "Help", icon: "help" }
];

export const FavoritesHelpLinks: { label: string; href: string }[] = [
  { label: "Controls & Help", href: "https://github.com/bruh3396/favorites-search-gallery/#controls" },
  { label: "Report an Issue", href: "https://github.com/bruh3396/favorites-search-gallery/issues" }
];
