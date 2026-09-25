import { Environment } from "@/app/context/environment";
import { SettingsCatalog } from "@/features/favorites/control/settings/catalog";
import { SettingsSection } from "@/features/favorites/control/settings/types";

export function buildSettingsSections(catalog: SettingsCatalog, environment: Environment): SettingsSection[] {
  const onMobile = environment.onMobileDevice;
  return [
    {
      title: "General",
      expanded: true,
      controls: onMobile ? [
        catalog.enhanceSearchPages,
        catalog.mobileGallery
      ] : [
        catalog.performanceProfile,
        catalog.enhanceSearchPages,
        catalog.hints
      ]
    },
    {
      title: "Interaction",
      controls: onMobile ? [
        catalog.postActionBarToggle,
        catalog.postActionBarButtons
      ] : [
        catalog.postActionBar,
        catalog.postActionBarButtons,
        catalog.postOverlay,
        catalog.tooltip
      ]
    },
    {
      title: "Appearance",
      controls: onMobile ? [
        catalog.theme,
        catalog.darkMode,
        catalog.header,
        catalog.upscale
      ] : [
        catalog.theme,
        catalog.darkMode,
        catalog.header,
        catalog.upscale
        // catalog.upscaleQuality
      ]
    },
    {
      title: "Layout",
      controls: onMobile ? [
        catalog.layout,
        catalog.columnCount
      ] : [
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
      controls: onMobile ? [
        catalog.autoplay,
        catalog.themedBackground
      ] : [
        catalog.autoplay,
        catalog.galleryMenu,
        catalog.fullscreenOnHover,
        catalog.themedBackground,
        catalog.backgroundOpacity
      ]
    }
  ];
}
