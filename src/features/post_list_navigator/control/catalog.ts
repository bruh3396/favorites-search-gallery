import { ActionBarButton, ActionBarMode, setActionBarButtons, setActionBarMode } from "@/lib/ui/thumb/action_bar";
import { EnableRule, enableWhen } from "@/lib/ui/settings/enable_rule";
import { Layout, PerformanceProfile } from "@/types/app";
import { dropdown, multiSegmented, segmented, stepper, toggle } from "@/lib/ui/settings/controls";
import { AppContext } from "@/app/context/context";
import { Preferences } from "@/app/context/preferences";
import { SettingsControl } from "@/lib/ui/settings/controls";
import { ThumbConfig } from "@/config/thumb_config";
import { booleanPreference } from "@/lib/storage/preference";
import { reloadWindow } from "@/utils/browser/window";
import { toggleGalleryMenuEnabled } from "@/lib/ui/toggles";

export type PostListSettingsCatalog = Record<string, SettingsControl>;

export function buildPostListSettingsCatalog(context: AppContext): PostListSettingsCatalog {
  const { preferences, environment, flags } = context;
  return {
    upscale: toggle({
      id: "post-list-upscale",
      label: "Upscale",
      tooltip: "Upscale thumbnails on search pages",
      enabled: flags.galleryEnabled && environment.onDesktopDevice && preferences.app.performanceProfile.value === "normal",
      preference: preferences.postList.upscaleThumbs
    }),
    infiniteScroll: toggle({
      id: "post-list-inf-scroll",
      label: "Infinite Scroll",
      tooltip: "Use infinite scroll instead of pages",
      preference: preferences.postList.infiniteScroll
    }),
    autoplay: toggle({
      id: "enable-autoplay",
      label: "Autoplay",
      tooltip: "Autoplay in gallery",
      enabled: flags.galleryEnabled,
      preference: preferences.gallery.autoplayActive
    }),
    tooltip: toggle({
      id: "enable-tooltip",
      label: "Tooltip",
      tooltip: "Show tags when hovering over a thumbnail",
      enabled: flags.tooltipEnabled,
      preference: preferences.postList.tooltipEnabled
    }),
    galleryMenu: toggle({
      id: "enable-gallery-menu",
      label: "Gallery Menu",
      tooltip: "Show menu in gallery",
      enabled: flags.galleryEnabled,
      apply: toggleGalleryMenuEnabled,
      preference: preferences.gallery.menuEnabled
    }),
    favoriteIndicator: toggle({
      id: "favorite-indicator",
      label: "Favorite Indicator",
      tooltip: "Mark thumbs already favorited",
      preference: preferences.postList.favoriteIndicator
    }),
    postActionBar: segmented<ActionBarMode>({
      id: "post-action-bar",
      label: "Actions",
      tooltip: "Show actions thumbnails",
      preference: preferences.postList.postActionBar,
      applyOnBuild: true,
      apply: setActionBarMode,
      options: new Map<ActionBarMode, string>([
        ["always", "Always"],
        ["hover", "Hover"],
        ["off", "Off"]
      ])
    }),
    postActionBarButtons: multiSegmented<ActionBarButton>({
      id: "post-action-bar-buttons",
      label: "Action Buttons",
      tooltip: "Choose which actions appear on thumbnails",
      preference: preferences.postList.postActionBarButtons,
      applyOnBuild: true,
      apply: setActionBarButtons,
      requireSelection: true,
      options: new Map<ActionBarButton, string>([
        [ActionBarButton.Favorite, "Favorite"],
        [ActionBarButton.Download, "Download"],
        [ActionBarButton.Open, "Open"]
      ])
    }),
    postActionBarToggle: toggle({
      id: "post-action-bar-toggle",
      label: "Show Actions",
      tooltip: "Show actions on thumbnails",
      preference: booleanPreference<ActionBarMode>(preferences.postList.postActionBar, "always", "off"),
      applyOnBuild: true,
      apply: (on) => setActionBarMode(on ? "always" : "off")
    }),
    layout: dropdown<Layout>({
      id: "layout-select",
      label: "Layout",
      tooltip: "Change layout",
      preference: preferences.postList.layout,
      options: new Map<Layout, string>([
        ["native", "Native"],
        ["column", "Waterfall"],
        ...(environment.onMobileDevice ? [] : [["row", "River"] as [Layout, string]]),
        ["square", "Square"],
        ["grid", "Grid"]
      ])
    }),
    columnCount: stepper({
      id: "column-count",
      label: "Columns",
      tooltip: "Number of columns",
      preference: preferences.postList.columnCount,
      min: ThumbConfig.columnCountBounds.min,
      max: environment.onDesktopDevice ? ThumbConfig.columnCountBounds.max.desktop : 10,
      step: 1,
      enabledWhen: whenLayoutIs(preferences, (layout) => layout !== "row" && layout !== "native")
    }),
    rowHeight: stepper({
      id: "row-size",
      label: "Row Height",
      tooltip: "Row height in the river layout",
      preference: preferences.postList.rowHeight,
      min: ThumbConfig.rowHeightBounds.min,
      max: ThumbConfig.rowHeightBounds.max,
      step: 1,
      enabledWhen: whenLayoutIs(preferences, (layout) => layout === "row")
    }),
    performanceProfile: dropdown<PerformanceProfile>({
      id: "performance-profile",
      label: "Performance",
      tooltip: "Choose performance profile",
      preference: preferences.app.performanceProfile,
      apply: reloadWindow,
      enabled: environment.onDesktopDevice,
      options: new Map<PerformanceProfile, string>([
        ["normal", "Normal"],
        ["medium", "Medium"],
        ["low", "Low"],
        ["potato", "Potato"]
      ])
    }),
    mobileGallery: toggle({
      id: "enable-mobile-gallery",
      label: "Gallery",
      enabled: flags.galleryEnabled,
      preference: preferences.gallery.mobileEnabled
    })
  };
}

function whenLayoutIs(preferences: Preferences, predicate: (layout: Layout) => boolean): EnableRule {
  return enableWhen(preferences.postList.layout, predicate);
}
