import { SettingsCatalog } from "@/features/favorites/control/desktop/settings/catalog";
import { SettingsSection } from "@/features/favorites/control/desktop/settings/types";

export const SettingsSections: SettingsSection[] = [
  {
    title: "General",
    controls: [
      SettingsCatalog.performanceProfile,
      SettingsCatalog.enhanceSearchPages,
      SettingsCatalog.hints
    ]
  },
  {
    title: "Appearance",
    controls: [
      SettingsCatalog.theme,
      SettingsCatalog.darkMode,
      SettingsCatalog.header
    ]
  },
  {
    title: "Layout",
    controls: [
      SettingsCatalog.layout,
      SettingsCatalog.columnCount,
      SettingsCatalog.rowHeight
    ]
  },
  {
    title: "Results",
    controls: [
      SettingsCatalog.sortKey,
      SettingsCatalog.sortAscending,
      SettingsCatalog.infiniteScroll,
      SettingsCatalog.resultsPerPage
    ]
  },
  {
    title: "Search",
    controls: [
      SettingsCatalog.rating,
      SettingsCatalog.excludeBlacklist
    ]
  },
  {
    title: "Hover",
    controls: [
      SettingsCatalog.postOverlay,
      SettingsCatalog.tooltip,
      SettingsCatalog.fullscreenOnHover
    ]
  },
  {
    title: "Gallery",
    controls: [
      SettingsCatalog.autoplay,
      SettingsCatalog.galleryMenu
    ]
  }
];
