import { Environment } from "@/app/context/environment";
import { SettingsCatalog } from "@/features/favorites/control/settings/catalog";
import { SettingsSection } from "@/features/favorites/control/settings/types";

export function buildSettingsSections(catalog: SettingsCatalog, environment: Environment): SettingsSection[] {
  return environment.onMobileDevice ? mobileSections(catalog) : desktopSections(catalog);
}

function desktopSections(catalog: SettingsCatalog): SettingsSection[] {
  return [
    {
      title: "General",
      expanded: true,
      controls: [
        catalog.performanceProfile,
        catalog.enhanceSearchPages,
        catalog.hints
      ]
    },
    {
      title: "Thumbnails",
      controls: [
        catalog.postActionBar,
        catalog.postActionBarButtons,
        catalog.upscale,
        catalog.postOverlay,
        catalog.tooltip
      ]
    },
    {
      title: "Appearance",
      controls: [
        catalog.theme,
        catalog.darkMode,
        catalog.header
      ]
    },
    {
      title: "Layout",
      controls: [
        catalog.layout,
        catalog.columnCount,
        catalog.rowHeight
      ]
    },
    {
      title: "Results",
      controls: [
        catalog.rating,
        catalog.sortKey,
        catalog.sortAscending,
        catalog.excludeBlacklist,
        catalog.infiniteScroll,
        catalog.resultsPerPage
      ]
    },
    {
      title: "Gallery",
      controls: [
        catalog.autoplay,
        catalog.galleryMenu,
        catalog.fullscreenOnHover,
        catalog.themedBackground,
        catalog.backgroundOpacity
      ]
    }
  ];
}

function mobileSections(catalog: SettingsCatalog): SettingsSection[] {
  return [
    {
      title: "General",
      expanded: true,
      controls: [
        catalog.enhanceSearchPages,
        catalog.mobileGallery
      ]
    },
    {
      title: "Thumbnails",
      controls: [
        catalog.upscale,
        catalog.postActionBarToggle,
        catalog.postActionBarButtons
      ]
    },
    {
      title: "Appearance",
      controls: [
        catalog.theme,
        catalog.darkMode,
        catalog.header
      ]
    },
    {
      title: "Layout",
      controls: [
        catalog.layout,
        catalog.columnCount
      ]
    },
    {
      title: "Results",
      controls: [
        catalog.rating,
        catalog.sortKey,
        catalog.sortAscending,
        catalog.excludeBlacklist,
        catalog.infiniteScroll,
        catalog.resultsPerPage
      ]
    },
    {
      title: "Gallery",
      controls: [
        catalog.autoplay,
        catalog.themedBackground
      ]
    }
  ];
}
