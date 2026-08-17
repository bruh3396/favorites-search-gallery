import { SettingsCatalog } from "@/features/favorites/control/desktop/settings/catalog";
import { SettingsSection } from "@/features/favorites/control/desktop/settings/types";

export const SettingsSections: SettingsSection[] = [
  {
    title: "General",
    expanded: true,
    controls: [
      SettingsCatalog.performanceProfile,
      SettingsCatalog.enhanceSearchPages,
      SettingsCatalog.hints
    ]
  },
  {
    title: "Appearance",
    expanded: true,
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
    title: "Filter",
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
      SettingsCatalog.fullscreenOnHover,
      SettingsCatalog.postActionBar,
      SettingsCatalog.postActionBarStatic
    ]
  },
  {
    title: "Gallery",
    controls: [
      SettingsCatalog.autoplay,
      SettingsCatalog.galleryMenu,
      SettingsCatalog.themedBackground,
      SettingsCatalog.backgroundOpacity
    ]
  }
];
