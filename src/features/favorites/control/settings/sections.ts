import { FavoritesSettingsCatalog } from "@/features/favorites/control/settings/catalog";
import { SettingsSection } from "@/features/favorites/control/settings/types";

export const SettingsSections: SettingsSection[] = [
  {
    title: "General",
    expanded: true,
    controls: [
      FavoritesSettingsCatalog.performanceProfile,
      FavoritesSettingsCatalog.enhanceSearchPages,
      FavoritesSettingsCatalog.hints
    ]
  },
  {
    title: "Thumbs",
    expanded: true,
    controls: [FavoritesSettingsCatalog.postActionBar, FavoritesSettingsCatalog.postActionBarButtons]
  },
  {
    title: "Appearance",
    controls: [
      FavoritesSettingsCatalog.theme,
      FavoritesSettingsCatalog.darkMode,
      FavoritesSettingsCatalog.header
    ]
  },
  {
    title: "Layout",
    controls: [
      FavoritesSettingsCatalog.layout,
      FavoritesSettingsCatalog.infiniteScroll,
      FavoritesSettingsCatalog.resultsPerPage,
      FavoritesSettingsCatalog.columnCount,
      FavoritesSettingsCatalog.rowHeight
    ]
  },
  {
    title: "Results",
    controls: [
      FavoritesSettingsCatalog.rating,
      FavoritesSettingsCatalog.sortKey,
      FavoritesSettingsCatalog.sortAscending,
      FavoritesSettingsCatalog.excludeBlacklist

    ]
  },
  {
    title: "Gallery",
    controls: [
      FavoritesSettingsCatalog.autoplay,
      FavoritesSettingsCatalog.galleryMenu,
      FavoritesSettingsCatalog.fullscreenOnHover,
      FavoritesSettingsCatalog.themedBackground,
      FavoritesSettingsCatalog.backgroundOpacity
    ]
  },
  {
    title: "Extras",
    controls: [
      FavoritesSettingsCatalog.postOverlay,
      FavoritesSettingsCatalog.tooltip
    ]
  }
];
