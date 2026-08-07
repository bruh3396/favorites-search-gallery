import { DiscreteRating, Rating, SortKey } from "@/types/search";
import { EnableRule, enableWhen } from "@/lib/ui/settings/enable_rule";
import { GALLERY_ENABLED, POST_OVERLAY_ENABLED, TOOLTIP_ENABLED } from "@/app/context/flags";
import { Layout, PerformanceProfile } from "@/types/app";
import { SettingsControl, dropdown, multiSegmented, slider, stepper, toggle as toggleControl } from "@/lib/ui/settings/controls";
import { applyTheme, toggleGradient } from "@/lib/ui/theme/apply";
import { toggleGalleryMenuEnabled, toggleHeader } from "@/lib/ui/toggles";
import { DomEvents } from "@/app/dom/events";
import { FavoritesConfig } from "@/config/favorites_config";
import { GeneralConfig } from "@/config/general_config";
import { Preferences } from "@/app/context/preferences";
import { Theme } from "@/lib/ui/theme/themes";
import { ThumbConfig } from "@/config/thumb_config";
import { ToggleSetting } from "@/lib/ui/settings/setting";
import { USER_IS_ON_THEIR_OWN_FAVORITES_PAGE } from "@/lib/environment";
import { galleryOpened } from "@/app/channels/feature_bridge";
import { reloadWindow } from "@/utils/browser/window";
import { themeOptions } from "@/lib/ui/theme/builder";

function registerHotkey(key: string, fire: () => void): void {
  DomEvents.document.keydown.on((event) => {
    if (event.isHotkey && event.key.toLowerCase() === key.toLowerCase() && !galleryOpened()) {
      fire();
    }
  });
}

const toggle = (config: Partial<ToggleSetting>): SettingsControl => toggleControl({ registerHotkey, ...config });
const onLayout = (predicate: (layout: Layout) => boolean): EnableRule => enableWhen(Preferences.favorites.layout, predicate);
const whenNotInfiniteScroll = (): EnableRule => enableWhen(Preferences.favorites.infiniteScroll, (on) => !on);
const whenNotFullscreenOnHover = (): EnableRule => enableWhen(Preferences.gallery.previewEnabled, (on) => !on);

function applyCurrentTheme(): void {
  applyTheme(Preferences.app.theme.value, Preferences.app.darkMode.value);
}

export const FavoritesSettings = {
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
    tooltip: "Use the dark variant of the selected theme",
    preference: Preferences.app.darkMode,
    hotkey: "D",
    apply: applyCurrentTheme
  }),
  fadeThumbs: toggle({
    id: "fade-thumbs",
    label: "Fade In Thumbnails",
    tooltip: "Fade thumbnails in as they load (applies on reload)",
    preference: Preferences.app.fadeThumbs,
    apply: reloadWindow
  }),
  layout: dropdown<Layout>({
    id: "layout-select",
    tooltip: "Choose favorites layout",
    label: "Layout",
    preference: Preferences.favorites.layout,
    applyOnBuild: true,
    options: new Map<Layout, string>([
      ["column", "Waterfall"],
      ["row", "River"],
      ["square", "Square"],
      ["grid", "Classic"],
      ["native", "Native"]
    ])
  }),
  columnCount: stepper({
    id: "column-count",
    label: "Columns",
    tooltip: "Set column count (waterfall/square/classic layouts)",
    preference: Preferences.favorites.columnCount,
    min: ThumbConfig.columnCountBounds.min,
    max: ThumbConfig.columnCountBounds.max,
    step: 1,
    enabledWhen: onLayout((layout) => layout !== "row" && layout !== "native")
  }),
  rowHeight: stepper({
    id: "row-size",
    label: "Row Height",
    tooltip: "Set row height (river layout)",
    preference: Preferences.favorites.rowHeight,
    min: ThumbConfig.rowHeightBounds.min,
    max: ThumbConfig.rowHeightBounds.max,
    step: 1,
    enabledWhen: onLayout((layout) => layout === "row")
  }),
  header: toggle({
    id: "toggle-header",
    label: "Header",
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
    tooltip: "Autoplay videos in the gallery",
    enabled: GALLERY_ENABLED,
    preference: Preferences.gallery.autoplayActive
  }),
  fullscreenOnHover: toggle({
    id: "show-on-hover",
    label: "Fullscreen on Hover",
    tooltip: "Enlarge content on hover",
    enabled: GALLERY_ENABLED,
    preference: Preferences.gallery.previewEnabled
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
    tooltip: "Enable gallery and other features on search pages",
    preference: Preferences.postList.enabled
  }),
  infiniteScroll: toggle({
    id: "infinite-scroll",
    label: "Infinite Scroll",
    tooltip: "Use infinite scroll (waterfall) instead of paging",
    preference: Preferences.favorites.infiniteScroll
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
    tooltip: "Categorize tags when hovering over a thumbnail. Click to add to search. Middle click to quick search",
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
  performanceProfile: dropdown<PerformanceProfile>({
    id: "performance-profile",
    tooltip: "Improve performance by disabling features",
    label: "Performance Profile",
    preference: Preferences.app.performanceProfile,
    apply: reloadWindow,
    options: new Map<PerformanceProfile, string>([
      ["normal", "Normal"],
      ["medium", "No upscaling"],
      ["low", "No gallery"],
      ["potato", "Only search"]
    ])
  })
};
