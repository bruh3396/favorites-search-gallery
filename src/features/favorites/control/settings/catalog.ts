import { ActionBarButton, ActionBarMode } from "@/lib/thumb/action_bar/types";
import { DiscreteRating, Rating, SortKey } from "@/types/search";
import { GALLERY_ENABLED, POST_OVERLAY_ENABLED, TOOLTIP_ENABLED } from "@/app/context/flags";
import { Layout, PerformanceProfile } from "@/types/app";
import { ON_MOBILE_DEVICE, USER_IS_ON_THEIR_OWN_FAVORITES_PAGE } from "@/lib/environment";
import { applyCurrentTheme, toggle, whenLayout, whenNotFullscreenOnHover, whenNotInfiniteScroll } from "@/features/favorites/control/settings/helpers";
import { dropdown, multiSegmented, segmented, slider, stepper } from "@/lib/ui/settings/controls";
import { setActionBarButtons, setActionBarMode } from "@/lib/thumb/action_bar/toggles";
import { toggleGalleryMenuEnabled, toggleHeader, toggleNativeFont, toggleThemedGalleryBackground } from "@/lib/ui/toggles";
import { FavoritesConfig } from "@/config/favorites_config";
import { GeneralConfig } from "@/config/general_config";
import { Preferences } from "@/app/context/preferences";
import { Theme } from "@/lib/ui/theme/themes";
import { ThumbConfig } from "@/config/thumb_config";
import { booleanPreference } from "@/lib/storage/preference";
import { reloadWindow } from "@/utils/browser/window";
import { themeOptions } from "@/lib/ui/theme/builder";
import { toggleGradient } from "@/lib/ui/theme/apply";

export const FavoritesSettingsCatalog = {
  theme: dropdown<Theme>({
    id: "theme",
    tooltip: "Choose color theme",
    label: "Theme",
    preference: Preferences.app.theme,
    apply: applyCurrentTheme,
    options: themeOptions()
  }),
  darkMode: toggle({
    id: "dark-mode",
    label: "Dark Mode",
    tooltip: "Use dark variant of selected color theme",
    preference: Preferences.app.darkMode,
    hotkey: "D",
    apply: applyCurrentTheme
  }),
  nativeFont: toggle({
    id: "native-font",
    label: "Native Font",
    tooltip: "Use native site font",
    preference: Preferences.app.nativeFont,
    apply: toggleNativeFont
  }),
  fadeThumbs: toggle({
    id: "fade-thumbs",
    label: "Fade In Thumbnails",
    tooltip: "Fade thumbnails in as they load (applies on reload)",
    preference: Preferences.app.fadeThumbs,
    apply: reloadWindow
  }),
  layout: segmented<Layout>({
    id: "layout-select",
    tooltip: "Choose favorites layout",
    label: "Layout",
    preference: Preferences.favorites.layout,
    applyOnBuild: true,
    options: new Map<Layout, string>([
      ["column", "Waterfall"],
      ...(ON_MOBILE_DEVICE ? [] : [["row", "River"] as [Layout, string]]),
      ["square", "Square"],
      ["grid", "Grid"],
      ["native", "Native"]
    ])
  }),
  columnCount: stepper({
    id: "column-count",
    label: "Columns",
    tooltip: "Set column count for waterfall, square, and grid layouts",
    preference: Preferences.favorites.columnCount,
    min: ThumbConfig.columnCountBounds.min,
    max: ThumbConfig.columnCountBounds.max,
    step: 1,
    enabledWhen: whenLayout((layout) => layout !== "row" && layout !== "native")
  }),
  rowHeight: stepper({
    id: "row-size",
    label: "Row Height",
    tooltip: "Set row height for river layout",
    preference: Preferences.favorites.rowHeight,
    min: ThumbConfig.rowHeightBounds.min,
    max: ThumbConfig.rowHeightBounds.max,
    step: 1,
    enabledWhen: whenLayout((layout) => layout === "row")
  }),
  header: toggle({
    id: "toggle-header",
    label: "Site Header",
    tooltip: "Show site header",
    preference: Preferences.favorites.headerEnabled,
    applyOnBuild: true,
    apply: toggleHeader
  }),
  gradient: toggle({
    id: "toggle-gradient",
    label: "Gradient",
    tooltip: "Use gradient menu background",
    preference: Preferences.app.gradient,
    applyOnBuild: true,
    apply: toggleGradient
  }),
  autoplay: toggle({
    id: "enable-autoplay",
    label: "Autoplay",
    tooltip: "Automatically traverse gallery",
    enabled: GALLERY_ENABLED,
    preference: Preferences.gallery.autoplayActive
  }),
  fullscreenOnHover: toggle({
    id: "show-on-hover",
    label: "Enlarge on hover",
    tooltip: "Enlarge content on hover",
    enabled: GALLERY_ENABLED,
    preference: Preferences.gallery.previewEnabled
  }),
  themedBackground: toggle({
    id: "themed-background",
    label: "Themed Background",
    tooltip: "Use the current theme's background color for the gallery instead of black",
    enabled: GALLERY_ENABLED,
    preference: Preferences.gallery.themedBackground,
    apply: toggleThemedGalleryBackground
  }),
  backgroundOpacity: slider({
    id: "background-opacity",
    label: "Background Opacity",
    tooltip: "Set gallery background opacity",
    enabled: GALLERY_ENABLED,
    preference: Preferences.gallery.backgroundOpacity,
    min: 0,
    max: 1,
    step: 0.05
  }),
  galleryMenu: toggle({
    id: "enable-gallery-menu",
    label: "Menu",
    tooltip: "Show gallery sidebar",
    enabled: GALLERY_ENABLED && GeneralConfig.galleryMenuOptionEnabled,
    apply: toggleGalleryMenuEnabled,
    preference: Preferences.gallery.menuEnabled
  }),
  enhanceSearchPages: toggle({
    id: "enhance-post-lists",
    label: "Enhance Search Pages",
    tooltip: "Enable gallery and browser on search pages",
    preference: Preferences.postList.enabled
  }),
  infiniteScroll: toggle({
    id: "infinite-scroll",
    label: "Infinite Scroll",
    tooltip: "Use infinite scroll (waterfall) instead of paging",
    preference: Preferences.favorites.infiniteScroll
  }),
  postActionBar: segmented<ActionBarMode>({
    id: "post-action-bar",
    label: "Action Visibility",
    tooltip: "Show actions on thumbnails",
    preference: Preferences.favorites.postActionBar,
    applyOnBuild: true,
    apply: setActionBarMode,
    options: new Map<ActionBarMode, string>([
      ["always", "Always"],
      ["hover", "Hover"],
      ["off", "Off"]
    ])
  }),
  postActionBarToggle: toggle({
    id: "post-action-bar-toggle",
    label: "Show Actions",
    tooltip: "Show actions on thumbnails",
    preference: booleanPreference<ActionBarMode>(Preferences.favorites.postActionBar, "always", "off"),
    applyOnBuild: true,
    apply: (on) => setActionBarMode(on ? "always" : "off")
  }),
  postActionBarButtons: multiSegmented<ActionBarButton>({
    id: "post-action-bar-buttons",
    label: "Action Buttons",
    tooltip: "Choose which actions appear on thumbnails",
    preference: Preferences.favorites.postActionBarButtons,
    applyOnBuild: true,
    apply: setActionBarButtons,
    requireSelection: true,
    options: new Map<ActionBarButton, string>([
      [ActionBarButton.Favorite, "Favorite"],
      [ActionBarButton.Download, "Download"]
    ])
  }),
  excludeBlacklist: toggle({
    id: "exclude-blacklist",
    label: "Exclude Blacklist",
    tooltip: "Exclude favorites with blacklisted tags from search",
    enabled: USER_IS_ON_THEIR_OWN_FAVORITES_PAGE,
    preference: Preferences.favorites.excludeBlacklist
  }),
  rating: multiSegmented<Rating>({
    id: "allowed-ratings",
    label: "Rating",
    tooltip: "Choose which content ratings to include in search results",
    preference: Preferences.favorites.allowedRatings,
    requireSelection: true,
    options: new Map<Rating, string>([
      [DiscreteRating.Explicit, "Explicit"],
      [DiscreteRating.Questionable, "Questionable"],
      [DiscreteRating.Safe, "Safe"]
    ])
  }),
  sortKey: dropdown<SortKey>({
    id: "sort-key",
    tooltip: "Choose sort order of search results",
    label: "Sort By",
    preference: Preferences.favorites.sortKey,
    options: new Map<SortKey, string>([
      ["default", "Default"],
      ["score", "Score"],
      ["width", "Width"],
      ["height", "Height"],
      ["id", "Date Uploaded"],
      ["lastChangedTimestamp", "Date Changed"],
      ["duration", "Duration"],
      ["random", "Random"]
    ])
  }),
  sortAscending: toggle({
    id: "sort-ascending",
    label: "Sort Ascending",
    tooltip: "Sort search results in ascending order",
    preference: Preferences.favorites.sortAscending
  }),
  resultsPerPage: stepper({
    id: "results-per-page",
    label: "Results Per Page",
    tooltip: "Set search result count per page",
    preference: Preferences.favorites.resultsPerPage,
    min: FavoritesConfig.resultsPerPageBounds.min,
    max: FavoritesConfig.resultsPerPageBounds.max,
    step: FavoritesConfig.resultsPerPageStep,
    enabledWhen: whenNotInfiniteScroll()
  }),
  tooltip: toggle({
    id: "show-tooltips",
    label: "Tag Tooltip",
    tooltip: "Show all tags when hovering over a thumbnail and see which ones were matched by the latest search",
    enabled: TOOLTIP_ENABLED,
    preference: Preferences.favorites.tooltipEnabled,
    enabledWhen: whenNotFullscreenOnHover(),
    hotkey: "T"
  }),
  postOverlay: toggle({
    id: "show-post-overlay",
    label: "Tag Overlay",
    tooltip: "Show tag overlay on thumbnails",
    enabled: POST_OVERLAY_ENABLED,
    preference: Preferences.postOverlay.enabled,
    enabledWhen: whenNotFullscreenOnHover(),
    hotkey: "O"
  }),
  hints: toggle({
    id: "show-hints",
    label: "Hints",
    tooltip: "Show hints",
    preference: Preferences.favorites.hintsEnabled,
    hotkey: "H"
  }),
  performanceProfile: segmented<PerformanceProfile>({
    id: "performance-profile",
    tooltip: "Choose performance profile - Normal: all - Medium: no upscaling - Low: no gallery, Potato: search only",
    label: "Performance",
    preference: Preferences.app.performanceProfile,
    apply: reloadWindow,
    tooltipPosition: "below",
    options: new Map<PerformanceProfile, string>([
      ["normal", "Normal"],
      ["medium", "Medium"],
      ...(ON_MOBILE_DEVICE ? [] : [["low", "Low"] as [PerformanceProfile, string]]),
      ["potato", "Potato"]
    ])
  })
};
