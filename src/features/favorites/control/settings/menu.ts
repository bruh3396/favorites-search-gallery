import { FavoritesSettingsCatalog } from "@/features/favorites/control/settings/catalog";
import { ON_MOBILE_DEVICE } from "@/lib/environment";
import { SettingsSection } from "@/features/favorites/control/settings/types";

const DesktopSettingsSections: SettingsSection[] = [
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
    title: "Thumbnails",
    controls: [
      FavoritesSettingsCatalog.postActionBar,
      FavoritesSettingsCatalog.postActionBarButtons,
      FavoritesSettingsCatalog.postOverlay,
      FavoritesSettingsCatalog.tooltip
    ]
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
      FavoritesSettingsCatalog.excludeBlacklist,
      FavoritesSettingsCatalog.infiniteScroll,
      FavoritesSettingsCatalog.resultsPerPage
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
  }
];

const MobileSettingsSections: SettingsSection[] = [
  {
    title: "General",
    expanded: true,
    controls: [
      FavoritesSettingsCatalog.enhanceSearchPages,
      FavoritesSettingsCatalog.mobileGallery
    ]
  },
  {
    title: "Thumbnails",
    controls: [
      FavoritesSettingsCatalog.postActionBarToggle,
      FavoritesSettingsCatalog.postActionBarButtons
    ]
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
      FavoritesSettingsCatalog.columnCount
    ]
  },
  {
    title: "Results",
    controls: [
      FavoritesSettingsCatalog.rating,
      FavoritesSettingsCatalog.sortKey,
      FavoritesSettingsCatalog.sortAscending,
      FavoritesSettingsCatalog.excludeBlacklist,
      FavoritesSettingsCatalog.infiniteScroll,
      FavoritesSettingsCatalog.resultsPerPage
    ]
  },
  {
    title: "Gallery",
    controls: [
      FavoritesSettingsCatalog.autoplay,
      FavoritesSettingsCatalog.themedBackground
    ]
  }
];

export const SettingsSections: SettingsSection[] = ON_MOBILE_DEVICE ? MobileSettingsSections : DesktopSettingsSections;
