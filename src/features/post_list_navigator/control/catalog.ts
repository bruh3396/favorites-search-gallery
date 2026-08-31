import { ActionBarButton, ActionBarMode, setActionBarButtons, setActionBarMode } from "@/lib/thumb/action_bar";
import { EnableRule, enableWhen } from "@/lib/ui/settings/enable_rule";
import { GALLERY_ENABLED, PERFORMANCE_PROFILE, TOOLTIP_ENABLED } from "@/app/context/flags";
import { Layout, PerformanceProfile } from "@/types/app";
import { ON_DESKTOP_DEVICE, ON_MOBILE_DEVICE } from "@/lib/environment";
import { dropdown, multiSegmented, segmented, stepper, toggle } from "@/lib/ui/settings/controls";
import { Preferences } from "@/app/context/preferences";
import { ThumbConfig } from "@/config/thumb_config";
import { booleanPreference } from "@/lib/storage/preference";
import { reloadWindow } from "@/utils/browser/window";
import { toggleGalleryMenuEnabled } from "@/lib/ui/toggles";

export const PostListSettingsCatalog = {
  upscale: toggle({
    id: "post-list-upscale",
    label: "Upscale",
    tooltip: "Upscale thumbnails on search pages",
    enabled: GALLERY_ENABLED && ON_DESKTOP_DEVICE && PERFORMANCE_PROFILE === "normal",
    preference: Preferences.postList.upscaleThumbs
  }),
  infiniteScroll: toggle({
    id: "post-list-inf-scroll",
    label: "Infinite Scroll",
    tooltip: "Use infinite scroll instead of pages",
    preference: Preferences.postList.infiniteScroll
  }),
  autoplay: toggle({
    id: "enable-autoplay",
    label: "Autoplay",
    tooltip: "Autoplay in gallery",
    enabled: GALLERY_ENABLED,
    preference: Preferences.gallery.autoplayActive
  }),
  tooltip: toggle({
    id: "enable-tooltip",
    label: "Tooltip",
    tooltip: "Show tags when hovering over a thumbnail",
    enabled: TOOLTIP_ENABLED,
    preference: Preferences.postList.tooltipEnabled
  }),
  galleryMenu: toggle({
    id: "enable-gallery-menu",
    label: "Gallery Menu",
    tooltip: "Show menu in gallery",
    enabled: GALLERY_ENABLED,
    apply: toggleGalleryMenuEnabled,
    preference: Preferences.gallery.menuEnabled
  }),
  favoriteIndicator: toggle({
    id: "favorite-indicator",
    label: "Favorite Indicator",
    tooltip: "Mark thumbs already favorited",
    preference: Preferences.postList.favoriteIndicator
  }),
  postActionBar: segmented<ActionBarMode>({
    id: "post-action-bar",
    label: "Actions",
    tooltip: "Show actions thumbnails",
    preference: Preferences.postList.postActionBar,
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
    preference: Preferences.postList.postActionBarButtons,
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
    preference: booleanPreference<ActionBarMode>(Preferences.postList.postActionBar, "always", "off"),
    applyOnBuild: true,
    apply: (on) => setActionBarMode(on ? "always" : "off")
  }),
  layout: dropdown<Layout>({
    id: "layout-select",
    label: "Layout",
    tooltip: "Change layout",
    preference: Preferences.postList.layout,
    options: new Map<Layout, string>([
      ["native", "Native"],
      ["column", "Waterfall"],
      ...(ON_MOBILE_DEVICE ? [] : [["row", "River"] as [Layout, string]]),
      ["square", "Square"],
      ["grid", "Grid"]
    ])
  }),
  columnCount: stepper({
    id: "column-count",
    label: "Columns",
    tooltip: "Number of columns",
    preference: Preferences.postList.columnCount,
    min: ThumbConfig.columnCountBounds.min,
    max: ON_DESKTOP_DEVICE ? ThumbConfig.columnCountBounds.max : 10,
    step: 1,
    enabledWhen: whenLayoutIs((layout) => layout !== "row" && layout !== "native")
  }),
  rowHeight: stepper({
    id: "row-size",
    label: "Row Height",
    tooltip: "Row height in the river layout",
    preference: Preferences.postList.rowHeight,
    min: ThumbConfig.rowHeightBounds.min,
    max: ThumbConfig.rowHeightBounds.max,
    step: 1,
    enabledWhen: whenLayoutIs((layout) => layout === "row")
  }),
  performanceProfile: dropdown<PerformanceProfile>({
    id: "performance-profile",
    label: "Performance",
    tooltip: "Choose performance profile",
    preference: Preferences.app.performanceProfile,
    apply: reloadWindow,
    enabled: ON_DESKTOP_DEVICE,
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
    enabled: GALLERY_ENABLED,
    preference: Preferences.gallery.mobileEnabled
  })
};

function whenLayoutIs(predicate: (layout: Layout) => boolean): EnableRule {
  return enableWhen(Preferences.postList.layout, predicate);
}
