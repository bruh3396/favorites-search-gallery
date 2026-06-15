import { DiscreteRating, Rating, SortKey } from "@/types/search";
import { EnableRule, ToggleSetting, enableWhen } from "@/lib/ui/settings/setting";
import { GALLERY_ENABLED, POST_OVERLAY_ENABLED, TOOLTIP_ENABLED } from "@/app/context/flags";
import { Layout, PerformanceProfile, Theme } from "@/types/app";
import { SettingsControl, dropdown, multiSegmented, stepper, toggle as toggleControl } from "@/lib/ui/settings/controls";
import { applySurfaceGradient, applyTheme } from "@/lib/ui/theme";
import { toggleGalleryMenuEnabled, toggleHeader } from "@/lib/ui/toggles";
import { DomEvents } from "@/app/dom/events";
import { FavoritesConfig } from "@/config/favorites_config";
import { GeneralConfig } from "@/config/general_config";
import { Preferences } from "@/app/context/preferences";
import { ThumbConfig } from "@/config/thumb_config";
import { USER_IS_ON_THEIR_OWN_FAVORITES_PAGE } from "@/lib/environment";
import { galleryOpened } from "@/app/channels/feature_bridge";
import { reloadWindow } from "@/utils/browser/window";
import { toggleOptionHotkeyHints } from "@/features/favorites/dom_tweaks/toggles";

function registerHotkey(key: string, fire: () => void): void {
  DomEvents.document.keydown.on((event) => {
    if (event.isHotkey && event.key === key && !galleryOpened()) {
      fire();
    }
  });
}

const toggle = (config: Partial<ToggleSetting>): SettingsControl => toggleControl({ registerHotkey, ...config });

const onLayout = (predicate: (layout: Layout) => boolean): EnableRule => enableWhen(Preferences.favorites.layout, predicate);
const whenNotInfiniteScroll = (): EnableRule => enableWhen(Preferences.favorites.infiniteScroll, (on) => !on);

export const Settings = {
  theme: dropdown<Theme>({
    id: "theme",
    tooltip: "Theme",
    label: "Theme",
    preference: Preferences.app.theme,
    apply: applyTheme,
    options: new Map<Theme, string>([
      ["native-light", "Native Light"],
      ["native-dark", "Native Dark"],
      ["midnight", "Midnight"],
      ["ember", "Ember"],
      ["venom", "Venom"],
      ["zeal", "Zeal"],
      ["frozen-cobalt", "Frost"],
      ["cherry-blossom", "Cherry Blossom"],
      ["forest", "Forest"],
      ["parchment", "Parchment"]
    ])
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
    tooltip: "Favorites Layout",
    label: "Layout",
    preference: Preferences.favorites.layout,
    applyOnBuild: true,
    options: new Map<Layout, string>([
      ["column", "Waterfall"],
      ["row", "River"],
      ["square", "Square"],
      ["grid", "Legacy"],
      ["native", "Native"]
    ])
  }),
  columnCount: stepper({
    id: "column-count",
    label: "Columns",
    tooltip: "Number of columns in the waterfall/square/legacy layouts",
    preference: Preferences.favorites.columnCount,
    min: ThumbConfig.columnCountBounds.min,
    max: ThumbConfig.columnCountBounds.max,
    step: 1,
    enabledWhen: onLayout((layout) => layout !== "row" && layout !== "native")
  }),
  rowHeight: stepper({
    id: "row-size",
    label: "Row Height",
    tooltip: "Row height in the river layout",
    preference: Preferences.favorites.rowHeight,
    min: ThumbConfig.rowHeightBounds.min,
    max: ThumbConfig.rowHeightBounds.max,
    step: 1,
    enabledWhen: onLayout((layout) => layout === "row")
  }),
  header: toggle({
    id: "toggle-header",
    label: "Header",
    tooltip: "Site header",
    preference: Preferences.favorites.headerEnabled,
    applyOnBuild: true,
    apply: toggleHeader
  }),
  gradient: toggle({
    id: "toggle-surface-gradient",
    label: "Gradient",
    tooltip: "Gradient menu backgrounds",
    preference: Preferences.app.surfaceGradient,
    applyOnBuild: true,
    apply: applySurfaceGradient
  }),
  autoplay: toggle({
    id: "enable-autoplay",
    label: "Autoplay",
    tooltip: "Autoplay in gallery",
    enabled: GALLERY_ENABLED,
    preference: Preferences.gallery.autoplayActive
  }),
  fullscreenOnHover: toggle({
    id: "show-on-hover",
    label: "Fullscreen on Hover",
    tooltip: "Show fullscreen content on hover",
    enabled: GALLERY_ENABLED,
    preference: Preferences.gallery.previewEnabled
  }),
  galleryMenu: toggle({
    id: "enable-gallery-menu",
    label: "Menu",
    tooltip: "Show menu in gallery",
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
    tooltip: "Use infinite scroll (waterfall) instead of pages",
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
    tooltip: "Which content ratings to include in search results",
    preference: Preferences.favorites.allowedRatings,
    options: new Map<Rating, string>([
      [DiscreteRating.Safe, "Safe"],
      [DiscreteRating.Questionable, "Questionable"],
      [DiscreteRating.Explicit, "Explicit"]
    ])
  }),
  sortKey: dropdown<SortKey>({
    id: "sort-key",
    tooltip: "Change sort order of search results",
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
    tooltip: "Number of search results shown per page",
    preference: Preferences.favorites.resultsPerPage,
    min: FavoritesConfig.resultsPerPageBounds.min,
    max: FavoritesConfig.resultsPerPageBounds.max,
    step: FavoritesConfig.resultsPerPageStep,
    enabledWhen: whenNotInfiniteScroll()
  }),
  tooltip: toggle({
    id: "show-tooltips",
    label: "Tooltip",
    tooltip: "Show all tags when hovering over a thumbnail and see which ones were matched by the latest search",
    enabled: TOOLTIP_ENABLED,
    preference: Preferences.favorites.tooltipEnabled,
    hotkey: "T"
  }),
  postOverlay: toggle({
    id: "show-post-overlay",
    label: "Tag Overlay",
    tooltip: "Categorize important tags when hovering over a thumbnail and click on them to add to search",
    enabled: POST_OVERLAY_ENABLED,
    preference: Preferences.postOverlay.enabled,
    hotkey: "O"
  }),
  hotkeyHints: toggle({
    id: "show-hints",
    label: "Hotkey Hints",
    tooltip: "Show hotkeys",
    preference: Preferences.favorites.hintsEnabled,
    hotkey: "H",
    applyOnBuild: true,
    apply: toggleOptionHotkeyHints
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
