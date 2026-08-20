import { ActionBarButton, ActionBarMode, setActionBarButtons, setActionBarMode } from "@/lib/thumb/action_bar";
import { EnableRule, enableWhen } from "@/lib/ui/settings/enable_rule";
import { GALLERY_ENABLED, PERFORMANCE_PROFILE, TOOLTIP_ENABLED } from "@/app/context/flags";
import { HighlightStyle, Layout, PerformanceProfile } from "@/types/app";
import { dropdown, multiSegmented, segmented, stepper, toggle } from "@/lib/ui/settings/controls";
import { ON_DESKTOP_DEVICE } from "@/lib/environment";
import { Preferences } from "@/app/context/preferences";
import { ThumbConfig } from "@/config/thumb_config";
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
    tooltip: "Mark thumbs you've already favorited",
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
    label: "Buttons",
    tooltip: "Choose which actions appear on thumbnails",
    preference: Preferences.postList.postActionBarButtons,
    applyOnBuild: true,
    apply: setActionBarButtons,
    requireSelection: true,
    options: new Map<ActionBarButton, string>([
      [ActionBarButton.Favorite, "Favorite"],
      [ActionBarButton.Download, "Download"]
    ])
  }),
  layout: dropdown<Layout>({
    id: "layout-select",
    label: "Layout",
    tooltip: "Change layout",
    preference: Preferences.postList.layout,
    options: new Map<Layout, string>([
      ["native", "Native"],
      ["column", "Waterfall"],
      ["row", "River"],
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
  favoriteIndicatorStyle: dropdown<HighlightStyle>({
    id: "favorite-indicator-style",
    label: "Favorites",
    tooltip: "Highlight style for favorited thumbs",
    preference: Preferences.postList.favoriteIndicatorStyle,
    enabledWhen: whenFavoriteIndicatorEnabled(),
    options: new Map<HighlightStyle, string>([
      ["border", "Border"],
      ["glow", "Glow"],
      ["trace", "Trace"],
      ["hidden", "Hidden"],
      ["none", "None"]
    ])
  }),
  galleryFavoriteStyle: dropdown<HighlightStyle>({
    id: "gallery-favorite-style",
    label: "Gallery Favorites",
    tooltip: "Highlight style for favorited thumbs in the gallery",
    preference: Preferences.postList.galleryFavoriteStyle,
    enabledWhen: whenFavoriteIndicatorEnabled(),
    options: new Map<HighlightStyle, string>([
      ["border", "Border"],
      ["glow", "Glow"],
      ["trace", "Trace"],
      ["none", "None"]
    ])
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
  })
};

function whenLayoutIs(predicate: (layout: Layout) => boolean): EnableRule {
  return enableWhen(Preferences.postList.layout, predicate);
}

function whenFavoriteIndicatorEnabled(): EnableRule {
  return enableWhen(Preferences.postList.favoriteIndicator, (on) => on);
}
