import { Environment } from "@/core/boundary/environment";
import { Host } from "@/core/boundary/ports/host";
import { SettingsCatalog } from "@/features/favorites/control/sections/settings/catalog";
import { SettingsControl } from "@/lib/ui/settings/controls";
import { SettingsSection } from "@/features/favorites/types/types";

export function buildSettingsSections(catalog: SettingsCatalog, environment: Environment, host: Host): SettingsSection[] {
  const onMobile = environment.device === "mobile";
  const header: SettingsControl[] = host.setHeaderVisible === null ? [] : [catalog.header];
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
      title: "Appearance",
      controls: onMobile ? [
        catalog.theme,
        catalog.darkMode,
        ...header,
        catalog.upscale
      ] : [
        catalog.theme,
        catalog.darkMode,
        ...header,
        catalog.upscale,
        catalog.upscaleQuality
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
