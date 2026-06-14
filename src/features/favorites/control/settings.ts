import { DiscreteRating, Rating, SortKey } from "@/types/search";
import { EnableRule, SelectSetting, StepperSetting, ToggleSetting, enableWhen } from "@/features/favorites/types/setting";
import { GALLERY_ENABLED, POST_OVERLAY_ENABLED, TOOLTIP_ENABLED } from "@/app/context/flags";
import { Layout, PerformanceProfile, Theme } from "@/types/app";
import { applySurfaceGradient, applyTheme } from "@/lib/ui/theme";
import { toggleGalleryMenuEnabled, toggleHeader } from "@/lib/ui/toggles";
import { Events } from "@/app/channels/events";
import { FavoritesConfig } from "@/config/favorites_config";
import { GeneralConfig } from "@/config/general_config";
import { Preferences } from "@/app/context/preferences";
import { ThumbConfig } from "@/config/thumb_config";
import { USER_IS_ON_THEIR_OWN_FAVORITES_PAGE } from "@/lib/environment";
import { buildDropdownRow } from "@/features/favorites/control/components/dropdown";
import { buildMultiSegmentedRow } from "@/features/favorites/control/components/multi_segmented";
import { buildSegmentedRow } from "@/features/favorites/control/components/segmented";
import { buildStepperRow } from "@/features/favorites/control/components/stepper";
import { buildToggleRow } from "@/features/favorites/control/components/toggle";
import { hideUnusedLayoutSizer } from "@/app/layout/content_tiler";
import { reloadWindow } from "@/utils/browser/window";
import { toggleOptionHotkeyHints } from "@/features/favorites/dom_tweaks/toggles";

export type SettingsControl = () => HTMLElement;
export const toggle = (config: Partial<ToggleSetting>): SettingsControl => (): HTMLElement => buildToggleRow(config);
export const segmented = <T extends string>(config: Partial<SelectSetting<T>>): SettingsControl => (): HTMLElement => buildSegmentedRow(config);
export const multiSegmented = <T extends number>(config: Partial<SelectSetting<T>>): SettingsControl => (): HTMLElement => buildMultiSegmentedRow(config);
export const dropdown = <T extends string>(config: Partial<SelectSetting<T>>): SettingsControl => (): HTMLElement => buildDropdownRow(config);
export const stepper = (config: Partial<StepperSetting>): SettingsControl => (): HTMLElement => buildStepperRow(config);

const onLayout = (predicate: (layout: Layout) => boolean): EnableRule => enableWhen(Events.favorites.layoutChanged, () => Preferences.favorites.layout.value, predicate);
const whenNotInfiniteScroll = (): EnableRule => enableWhen(Events.favorites.infiniteScrollToggled, () => Preferences.favorites.infiniteScroll.value, (on) => !on);

export const Settings = {
  theme: dropdown<Theme>({
    id: "theme",
    tooltip: "Theme",
    label: "Theme",
    preference: Preferences.app.theme,
    function: applyTheme,
    options: new Map<Theme, string>([
      ["native-light", "Native Light"],
      ["native-dark", "Native Dark"],
      ["midnight", "Midnight"],
      ["ember", "Ember"],
      ["venom", "Venom"],
      ["zeal", "Zeal"],
      ["frozen-cobalt", "Cobalt"],
      ["cherry-blossom", "Cherry Blossom"],
      ["forest", "Forest"]
    ])
  }),
  fadeThumbs: toggle({
    id: "fade-thumbs",
    label: "Fade Thumbnails",
    tooltip: "Fade thumbnails in as they load (applies on reload)",
    preference: Preferences.app.fadeThumbs,
    function: reloadWindow
  }),
  layout: dropdown<Layout>({
    id: "layout-select",
    tooltip: "Favorites Layout",
    label: "Layout",
    preference: Preferences.favorites.layout,
    event: Events.favorites.layoutChanged,
    function: hideUnusedLayoutSizer,
    triggerOnCreation: true,
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
    event: Events.app.columnCountChanged,
    disableOn: onLayout((layout) => layout !== "row" && layout !== "native")
  }),
  rowHeight: stepper({
    id: "row-size",
    label: "Row Height",
    tooltip: "Row height in the river layout",
    preference: Preferences.favorites.rowHeight,
    min: ThumbConfig.rowHeightBounds.min,
    max: ThumbConfig.rowHeightBounds.max,
    step: 1,
    event: Events.app.rowHeightChanged,
    disableOn: onLayout((layout) => layout === "row")
  }),
  header: toggle({
    id: "toggle-header",
    label: "Header",
    tooltip: "Site header",
    preference: Preferences.favorites.headerEnabled,
    triggerOnCreation: true,
    function: toggleHeader
  }),
  gradient: toggle({
    id: "toggle-surface-gradient",
    label: "Gradient",
    tooltip: "Gradient menu backgrounds",
    preference: Preferences.app.surfaceGradient,
    triggerOnCreation: true,
    function: applySurfaceGradient
  }),
  autoplay: toggle({
    id: "enable-autoplay",
    label: "Autoplay",
    tooltip: "Autoplay in gallery",
    enabled: GALLERY_ENABLED,
    preference: Preferences.gallery.autoplayActive,
    event: Events.app.autoplayToggled
  }),
  fullscreenOnHover: toggle({
    id: "show-on-hover",
    label: "Fullscreen on Hover",
    tooltip: "Show fullscreen content on hover",
    enabled: GALLERY_ENABLED,
    preference: Preferences.gallery.previewEnabled,
    event: Events.favorites.galleryPreviewToggled
  }),
  galleryMenu: toggle({
    id: "enable-gallery-menu",
    label: "Menu",
    tooltip: "Show menu in gallery",
    enabled: GALLERY_ENABLED && GeneralConfig.galleryMenuOptionEnabled,
    function: toggleGalleryMenuEnabled,
    preference: Preferences.gallery.menuEnabled,
    event: Events.app.galleryMenuToggled
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
    preference: Preferences.favorites.infiniteScroll,
    event: Events.favorites.infiniteScrollToggled
  }),
  excludeBlacklist: toggle({
    id: "exclude-blacklist",
    label: "Exclude Blacklist",
    tooltip: "Exclude favorites with blacklisted tags from search",
    enabled: USER_IS_ON_THEIR_OWN_FAVORITES_PAGE,
    preference: Preferences.favorites.excludeBlacklist,
    event: Events.favorites.blacklistToggled
  }),
  ratings: multiSegmented<Rating>({
    id: "allowed-ratings",
    label: "Ratings",
    tooltip: "Which content ratings to include in search results",
    preference: Preferences.favorites.allowedRatings,
    event: Events.favorites.allowedRatingsChanged,
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
    event: Events.favorites.sortKeyChanged,
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
    preference: Preferences.favorites.sortAscending,
    event: Events.favorites.sortAscendingToggled
  }),
  resultsPerPage: stepper({
    id: "results-per-page",
    label: "Results Per Page",
    tooltip: "Number of search results shown per page",
    preference: Preferences.favorites.resultsPerPage,
    min: FavoritesConfig.resultsPerPageBounds.min,
    max: FavoritesConfig.resultsPerPageBounds.max,
    step: FavoritesConfig.resultsPerPageStep,
    event: Events.favorites.resultsPerPageChanged,
    disableOn: whenNotInfiniteScroll()
  }),
  tooltip: toggle({
    id: "show-tooltips",
    label: "Tooltip",
    tooltip: "Show all tags when hovering over a thumbnail and see which ones were matched by the latest search",
    enabled: TOOLTIP_ENABLED,
    preference: Preferences.favorites.tooltipEnabled,
    hotkey: "T",
    event: Events.app.tooltipToggled
  }),
  postOverlay: toggle({
    id: "show-post-overlay",
    label: "Tag Overlay",
    tooltip: "Categorize important tags when hovering over a thumbnail and click on them to add to search",
    enabled: POST_OVERLAY_ENABLED,
    preference: Preferences.postOverlay.enabled,
    hotkey: "O",
    event: Events.favorites.postOverlayToggled
  }),
  hotkeyHints: toggle({
    id: "show-hints",
    label: "Hotkey Hints",
    tooltip: "Show hotkeys",
    preference: Preferences.favorites.hintsEnabled,
    hotkey: "H",
    triggerOnCreation: true,
    function: toggleOptionHotkeyHints
  }),
  performanceProfile: dropdown<PerformanceProfile>({
    id: "performance-profile",
    tooltip: "Improve performance by disabling features",
    label: "Performance Profile",
    preference: Preferences.app.performanceProfile,
    event: Events.app.performanceProfileChanged,
    function: reloadWindow,
    options: new Map<PerformanceProfile, string>([
      ["normal", "Normal"],
      ["medium", "No upscaling"],
      ["low", "No gallery"],
      ["potato", "Only search"]
    ])
  })
};
