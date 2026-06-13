import { ButtonElement, CheckboxElement, NumberElement, SelectElement } from "@/types/element";
import { GALLERY_ENABLED, POST_OVERLAY_ENABLED, TOOLTIP_ENABLED } from "@/app/context/flags";
import { Layout, PerformanceProfile, Theme } from "@/types/ui";
import { applySurfaceGradient, applyTheme } from "@/lib/ui/theme";
import { buildCheckboxElement, buildCheckboxOption } from "@/app/dom/checkbox";
import { toggleGalleryMenuEnabled, toggleHeader } from "@/lib/ui/toggles";
import { Events } from "@/app/channels/events";
import { FavoritesConfig } from "@/config/favorites_config";
import { FavoritesId } from "@/features/favorites/types/scaffold";
import { GeneralConfig } from "@/config/general_config";
import { MetadataMetric } from "@/types/search";
import { Preferences } from "@/app/context/preferences";
import { ThumbConfig } from "@/config/thumb_config";
import { USER_IS_ON_THEIR_OWN_FAVORITES_PAGE } from "@/lib/environment";
import { buildButtonElement } from "@/lib/ui/elements/button";
import { buildSelectElement } from "@/lib/ui/elements/select";
import { hideUnusedLayoutSizer } from "@/app/layout/content_tiler";
import { prepareDynamicElements } from "@/lib/ui/elements/dynamic_element_preparer";
import { reloadWindow } from "@/utils/browser/window";
import { toggleOptionHotkeyHints } from "@/features/favorites/dom_tweaks/toggles";

const buttons: Partial<ButtonElement>[] = [
  {
    id: "search-button",
    parentId: FavoritesId.searchButton,
    title: "Search",
    icon: "search",
    rightClickEnabled: true,
    event: Events.favorites.searchButtonClicked
  },
  {
    id: "shuffle-button",
    parentId: FavoritesId.buttonsSlot,
    // icon: "shuffle",
    textContent: "SHUFFLE",
    title: "Shuffle results",
    event: Events.favorites.shuffleButtonClicked
  },
  {
    id: "invert-button",
    parentId: FavoritesId.buttonsSlot,
    // icon: "invert",
    textContent: "INVERT",
    title: "Invert results",
    event: Events.favorites.invertButtonClicked
  },
  {
    id: "clear-button",
    parentId: FavoritesId.actions,
    icon: "clear",
    title: "Clear search",
    event: Events.favorites.clearButtonClicked
  },
  {
    id: "set-active_favorites_button",
    parentId: FavoritesId.actions,
    textContent: "Set Subset",
    title: "Make the current search results the entire set of results to search from",
    enabled: false,
    event: Events.favorites.setActiveFavoritesClicked
  },
  {
    id: "reset-active_favorites_button",
    parentId: FavoritesId.actions,
    textContent: "Stop Subset",
    title: "Reset active favorites to all",
    enabled: false,
    event: Events.favorites.resetActiveFavoritesClicked
  },
  {
    id: FavoritesId.panelButton,
    parentId: FavoritesId.drawerToggleSlot,
    icon: "hamburger",
    title: "Menu",
    event: Events.favorites.panelButtonClicked
  },
  {
    id: "reset-button",
    title: "Reset",
    parentId: FavoritesId.buttonsSlot,
    textContent: "RESET",
    event: Events.favorites.resetButtonClicked
  }

];

const checkboxes: Partial<CheckboxElement>[] = [
  {
    id: "enhance-post-lists",
    parentId: "favorite-options-left",
    textContent: "Enhance Search Pages",
    title: "Enable gallery and other features on search pages",
    preference: Preferences.postListEnabled,
    hotkey: "",
    savePreference: true
  },
  {
    id: "infinite-scroll",
    parentId: "favorite-options-left",
    textContent: "Infinite Scroll",
    title: "Use infinite scroll (waterfall) instead of pages",
    preference: Preferences.favoritesInfiniteScroll,
    hotkey: "",
    event: Events.favorites.infiniteScrollToggled
  },
  {
    id: "exclude-blacklist",
    parentId: "favorite-options-left",
    textContent: "Exclude Blacklist",
    title: "Exclude favorites with blacklisted tags from search",
    enabled: USER_IS_ON_THEIR_OWN_FAVORITES_PAGE,
    preference: Preferences.favoritesExcludeBlacklist,
    hotkey: "",
    event: Events.favorites.blacklistToggled
  },
  {
    id: "show-hints",
    parentId: "favorite-options-left",
    textContent: "Hotkey Hints",
    title: "Show hotkeys",
    preference: Preferences.favoritesHintsEnabled,
    hotkey: "H",
    triggerOnCreation: true,
    function: toggleOptionHotkeyHints
  },
  {
    id: "enable-autoplay",
    parentId: "favorite-options-right",
    textContent: "Autoplay",
    title: "Enable autoplay in gallery",
    enabled: GALLERY_ENABLED,
    preference: Preferences.galleryAutoplayActive,
    hotkey: "",
    event: Events.app.autoplayToggled
  },
  {
    id: "show-on-hover",
    parentId: "favorite-options-right",
    textContent: "Fullscreen on Hover",
    title: "View full resolution images or play videos and GIFs when hovering over a thumbnail",
    enabled: GALLERY_ENABLED,
    preference: Preferences.galleryPreviewEnabled,
    hotkey: "",
    event: Events.favorites.galleryPreviewToggled
  },
  {
    id: "show-tooltips",
    parentId: "favorite-options-right",
    textContent: "Tooltip",
    title: "Show all tags when hovering over a thumbnail and see which ones were matched by the latest search",
    enabled: TOOLTIP_ENABLED,
    preference: Preferences.favoritesTooltipEnabled,
    hotkey: "T",
    event: Events.app.tooltipToggled
  },
  {
    id: "show-post-overlay",
    parentId: "favorite-options-right",
    textContent: "Overlay",
    title: "Categorize important tags when hovering over a thumbnail and click on them to add to search",
    enabled: POST_OVERLAY_ENABLED,
    preference: Preferences.postOverlayEnabled,
    hotkey: "",
    event: Events.favorites.postOverlayToggled
  },
  {
    id: "toggle-header",
    parentId: "favorite-options-right",
    textContent: "Header",
    title: "Toggle site header",
    preference: Preferences.favoritesHeaderEnabled,
    hotkey: "",
    triggerOnCreation: true,
    function: toggleHeader
  },
  {
    id: "toggle-surface-gradient",
    parentId: "favorite-options-right",
    textContent: "Gradient",
    title: "Use a gradient background on the toolbar and drawer tabs",
    preference: Preferences.appSurfaceGradient,
    hotkey: "",
    triggerOnCreation: true,
    function: applySurfaceGradient
  },
  {
    id: "show-saved-search-suggestions",
    parentId: "favorite-options-right",
    textContent: "Saved Suggestions",
    title: "Show saved search suggestions in autocomplete dropdown",
    enabled: false,
    preference: Preferences.savedSearchesSuggestions,
    hotkey: "",
    savePreference: true
  },
  {
    id: "enable-gallery-menu",
    parentId: "favorite-options-right",
    textContent: "Gallery Menu",
    title: "Show menu in gallery",
    enabled: GALLERY_ENABLED && GeneralConfig.galleryMenuOptionEnabled,
    function: toggleGalleryMenuEnabled,
    preference: Preferences.galleryMenuEnabled,
    event: Events.app.galleryMenuToggled
  }
];

const simpleCheckboxes: Partial<CheckboxElement>[] = [
  {
    id: "sort-ascending",
    parentId: "sort-inputs",
    position: "beforeend",
    preference: Preferences.favoritesSortAscending,
    event: Events.favorites.sortAscendingToggled
  }
];

const selects: (Partial<SelectElement<Layout>> | Partial<SelectElement<MetadataMetric>> | Partial<SelectElement<PerformanceProfile>> | Partial<SelectElement<Theme>>)[] = [
  {
    id: "theme",
    parentId: "favorite-options-right",
    title: "Change theme",
    preference: Preferences.appTheme,
    function: applyTheme,
    options: new Map<Theme, string>([
      ["native-light", "Light"],
      ["native-dark", "Dark"],
      ["midnight", "Midnight"]
    ])
  },
  {
    id: "sort-method",
    parentId: "sort-inputs",
    title: "Change sort order of search results",
    position: "beforeend",
    preference: Preferences.favoritesSortKey,
    event: Events.favorites.sortMethodChanged,
    options: new Map<MetadataMetric, string>([
      ["default", "Default"],
      ["score", "Score"],
      ["width", "Width"],
      ["height", "Height"],
      ["id", "Date Uploaded"],
      ["lastChangedTimestamp", "Date Changed"],
      ["duration", "Duration"],
      ["random", "Random"]
    ])
  },
  {
    id: "layout-select",
    parentId: "layout-container",
    title: "Change layout",
    position: "beforeend",
    preference: Preferences.favoritesLayout,
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
  },
  {
    id: "performance-profile",
    parentId: "performance-profile-container",
    title: "Improve performance by disabling features",
    position: "beforeend",
    preference: Preferences.appPerformanceProfile,
    event: Events.app.performanceProfileChanged,
    function: reloadWindow,
    options: new Map<PerformanceProfile, string>([
      ["normal", "Normal"],
      ["medium", "Medium (no upscaling)"],
      ["low", "Low (no gallery)"],
      ["potato", "Potato (only search)"]
    ])
  }
];

const numbers: Partial<NumberElement>[] = [
  {
    id: "column-count",
    parentId: "column-count-container",
    position: "beforeend",
    preference: Preferences.favoritesColumnCount,
    min: ThumbConfig.columnCountBounds.min,
    max: ThumbConfig.columnCountBounds.max,
    step: 1,
    pollingTime: 50,
    event: Events.app.columnCountChanged
  },

  {
    id: "row-size",
    parentId: "row-size-container",
    position: "beforeend",
    preference: Preferences.favoritesRowHeight,
    min: ThumbConfig.rowHeightBounds.min,
    max: ThumbConfig.rowHeightBounds.max,
    step: 1,
    pollingTime: 50,
    event: Events.app.rowHeightChanged
  },

  {
    id: "results-per-page",
    parentId: "results-per-page-container",
    position: "beforeend",
    preference: Preferences.favoritesResultsPerPage,
    min: FavoritesConfig.resultsPerPageBounds.min,
    max: FavoritesConfig.resultsPerPageBounds.max,
    step: FavoritesConfig.resultsPerPageStep,
    pollingTime: 50,
    event: Events.favorites.resultsPerPageChanged
  }
];

export function setup(): void {
  prepareDynamicElements(buttons).forEach(buildButtonElement);
  prepareDynamicElements(checkboxes).forEach(buildCheckboxOption);
  prepareDynamicElements(simpleCheckboxes).forEach(buildCheckboxElement);
  // @ts-expect-error don't care
  prepareDynamicElements(selects).forEach(buildSelectElement);
  // prepareDynamicElements(numbers).forEach(buildNumberComponent);
}
