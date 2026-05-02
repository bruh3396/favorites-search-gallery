import { ButtonElement, CheckboxElement, NumberElement, SelectElement } from "../../../../lib/ui/element_types";
import { CAPTIONS_ENABLED, GALLERY_ENABLED, TOOLTIP_ENABLED } from "../../../../lib/environment/derived_environment";
import { LayoutMode, PerformanceProfile } from "../../../../types/ui";
import { buildCheckboxElement, buildCheckboxOption } from "../../../../lib/ui/element/checkbox";
import { toggleAddOrRemoveButtons, toggleAlternateLayout, toggleDownloadButtons, toggleHeader, toggleMaximizeToggleFavoriteButtons, toggleSlimLayout } from "../../../../lib/ui/toggles";
import { toggleDarkTheme, toggleGalleryMenuEnabled, toggleSavedSearchesVisibility, usingDarkTheme } from "../../../../lib/ui/style";
import { toggleFavoritesOptions, toggleOptionHotkeyHints, toggleUI, tryResetting } from "../../view/update/favorites_menu_event_handlers";
import { Events } from "../../../../lib/communication/events";
import { FavoritesSettings } from "../../../../config/favorites_settings";
import { GeneralSettings } from "../../../../config/general_settings";
import { MetadataMetric } from "../../../../types/search";
import { Preferences } from "../../../../lib/preferences/preferences";
import { USER_IS_ON_THEIR_OWN_FAVORITES_PAGE } from "../../../../lib/environment/environment";
import { buildButtonElement } from "../../../../lib/ui/element/button";
import { buildNumberComponent } from "../../../../lib/ui/element/number_input";
import { buildSelectElement } from "../../../../lib/ui/element/select";
import { hideUnusedLayoutSizer } from "../../../../lib/layout/layout_event_handlers";
import { prepareDynamicElements } from "../../../../lib/ui/element/element_utils";
import { reloadWindow } from "../../../../utils/browser/window";

const buttons: Partial<ButtonElement>[] = [
  {
    id: "search-button",
    parentId: "favorites-main-buttons-container",
    title: "Search favorites\nctrl+click/right-click: Search all of rule34 in a new tab",
    position: "afterbegin",
    textContent: "Search",
    rightClickEnabled: true,
    event: Events.favorites.searchButtonClicked
  },
  {
    id: "shuffle-button",
    parentId: "favorites-main-buttons-container",
    textContent: "Shuffle",
    title: "Randomize order of search results",
    event: Events.favorites.shuffleButtonClicked
  },
  {
    id: "invert-button",
    parentId: "favorites-main-buttons-container",
    textContent: "Invert",
    title: "Show results not matched by latest search",
    event: Events.favorites.invertButtonClicked
  },
  {
    id: "clear-button",
    parentId: "favorites-main-buttons-container",
    textContent: "Clear",
    title: "Empty the search box",
    event: Events.favorites.clearButtonClicked
  },
  {
    id: "download-button",
    parentId: "favorites-main-buttons-container",
    textContent: "Download",
    title: "Download search results (experimental)",
    event: Events.favorites.downloadButtonClicked
  },
  {
    id: "set-active_favorites_button",
    parentId: "favorites-main-buttons-container",
    textContent: "Set Subset",
    title: "Make the current search results the entire set of results to search from",
    enabled: false,
    event: Events.favorites.setActiveFavoritesClicked
  },
  {
    id: "reset-active_favorites_button",
    parentId: "favorites-main-buttons-container",
    textContent: "Stop Subset",
    title: "Reset active favorites to all",
    enabled: false,
    event: Events.favorites.resetActiveFavoritesClicked
  },
  {
    id: "reset-button",
    parentId: "favorites-main-buttons-container",
    textContent: "Reset",
    title: "Delete cached favorites and reset preferences",
    function: tryResetting,
    event: Events.favorites.resetButtonClicked
  }

];

const checkboxes: Partial<CheckboxElement>[] = [
  {
    id: "options",
    parentId: "bottom-panel-1",
    textContent: "More Options",
    title: "Show more options",
    preference: Preferences.optionsVisible,
    hotkey: "O",
    function: toggleFavoritesOptions,
    triggerOnCreation: true,
    event: Events.favorites.optionsToggled
  },
  {
    id: "show-ui",
    parentId: "show-ui-wrapper",
    textContent: "UI",
    title: "Toggle UI",
    preference: Preferences.uiVisible,
    hotkey: "U",
    function: toggleUI,
    triggerOnCreation: true,
    event: Events.favorites.uiToggled
  },
  {
    id: "enhance-search-pages",
    parentId: "favorite-options-left",
    textContent: "Enhance Search Pages",
    title: "Enable gallery and other features on search pages",
    preference: Preferences.searchPages,
    hotkey: "",
    savePreference: true
  },
  {
    id: "infinite-scroll",
    parentId: "favorite-options-left",
    textContent: "Infinite Scroll",
    title: "Use infinite scroll (waterfall) instead of pages",
    preference: Preferences.infiniteScroll,
    hotkey: "",
    event: Events.favorites.infiniteScrollToggled
  },
  {
    id: "show-remove-favorite-buttons",
    parentId: "favorite-options-left",
    textContent: "Remove Buttons",
    title: "Toggle remove favorite buttons",
    enabled: USER_IS_ON_THEIR_OWN_FAVORITES_PAGE,
    preference: Preferences.removeButtonsVisible,
    hotkey: "R",
    function: toggleAddOrRemoveButtons,
    event: Events.favorites.removeButtonsToggled,
    triggerOnCreation: true
  },
  {
    id: "show-add-favorite-buttons",
    parentId: "favorite-options-left",
    textContent: "Add Favorite Buttons",
    title: "Toggle add favorite buttons",
    enabled: !USER_IS_ON_THEIR_OWN_FAVORITES_PAGE,
    preference: Preferences.addButtonsVisible,
    function: toggleAddOrRemoveButtons,
    hotkey: "R",
    event: Events.favorites.addButtonsToggled,
    triggerOnCreation: true
  },
  {
    id: "maximize-toggle-favorite-buttons",
    parentId: "favorite-options-left",
    textContent: `Maximize ${USER_IS_ON_THEIR_OWN_FAVORITES_PAGE ? "Remove" : "Add"} Buttons`,
    title: "Maximize toggle favorite buttons",
    preference: Preferences.maximizeToggleFavoriteButtons,
    function: toggleMaximizeToggleFavoriteButtons,
    enabled: false,
    triggerOnCreation: true
  },
  {
    id: "alternate-layout",
    parentId: "favorite-options-left",
    textContent: "Alternate Layout",
    title: "Toggle alternate layout",
    preference: Preferences.alternateLayout,
    function: toggleAlternateLayout,
    event: Events.favorites.alternateLayoutToggled,
    enabled: false,
    triggerOnCreation: true
  },
  {
    id: "slim-layout",
    parentId: "favorite-options-left",
    textContent: "Slim Layout",
    title: "Toggle slim layout",
    preference: Preferences.slimLayout,
    function: toggleSlimLayout,
    // enabled: false,
    triggerOnCreation: true
  },
  {
    id: "show-download-buttons",
    parentId: "favorite-options-left",
    textContent: "Download Buttons",
    title: "Toggle download buttons",
    enabled: true,
    preference: Preferences.downloadButtonsVisible,
    hotkey: "",
    function: toggleDownloadButtons,
    triggerOnCreation: true,
    event: Events.favorites.downloadButtonsToggled
  },
  {
    id: "exclude-blacklist",
    parentId: "favorite-options-left",
    textContent: "Exclude Blacklist",
    title: "Exclude favorites with blacklisted tags from search",
    enabled: USER_IS_ON_THEIR_OWN_FAVORITES_PAGE,
    preference: Preferences.excludeBlacklist,
    hotkey: "",
    event: Events.favorites.blacklistToggled
  },
  {
    id: "show-hints",
    parentId: "favorite-options-left",
    textContent: "Hotkey Hints",
    title: "Show hotkeys",
    preference: Preferences.hintsEnabled,
    hotkey: "H",
    event: Events.favorites.hintsToggled,
    triggerOnCreation: true,
    function: toggleOptionHotkeyHints
  },
  {
    id: "enable-autoplay",
    parentId: "favorite-options-right",
    textContent: "Autoplay",
    title: "Enable autoplay in gallery",
    enabled: GALLERY_ENABLED,
    preference: Preferences.autoplayActive,
    hotkey: "",
    event: Events.favorites.autoplayToggled
  },
  {
    id: "show-on-hover",
    parentId: "favorite-options-right",
    textContent: "Fullscreen on Hover",
    title: "View full resolution images or play videos and GIFs when hovering over a thumbnail",
    enabled: GALLERY_ENABLED,
    preference: Preferences.showOnHover,
    hotkey: "",
    event: Events.favorites.showOnHoverToggled
  },
  {
    id: "show-tooltips",
    parentId: "favorite-options-right",
    textContent: "Tooltips",
    title: "Show tags when hovering over a thumbnail and see which ones were matched by a search",
    enabled: TOOLTIP_ENABLED,
    preference: Preferences.tooltipsVisible,
    hotkey: "T",
    event: Events.favorites.tooltipsToggled
  },
  {
    id: "show-captions",
    parentId: "favorite-options-right",
    textContent: "Details",
    title: "Show details when hovering over thumbnail",
    enabled: CAPTIONS_ENABLED,
    preference: Preferences.captionsVisible,
    hotkey: "D",
    event: Events.favorites.captionsToggled
  },
  {
    id: "toggle-header",
    parentId: "favorite-options-right",
    textContent: "Header",
    title: "Toggle site header",
    preference: Preferences.headerEnabled,
    hotkey: "",
    event: Events.favorites.headerToggled,
    triggerOnCreation: true,
    function: toggleHeader
  },
  {
    id: "dark-theme",
    parentId: "favorite-options-right",
    textContent: "Dark Theme",
    title: "Toggle dark theme",
    defaultValue: usingDarkTheme(),
    hotkey: "",
    event: Events.favorites.darkThemeToggled,
    function: toggleDarkTheme
  },
  {
    id: "use-aliases",
    parentId: "favorite-options-right",
    textContent: "Aliases",
    title: "Alias similar tags",
    enabled: false,
    preference: Preferences.tagAliasing,
    hotkey: "A"
  },
  {
    id: "show-saved-search-suggestions",
    parentId: "favorite-options-right",
    textContent: "Saved Suggestions",
    title: "Show saved search suggestions in autocomplete dropdown",
    enabled: false,
    preference: Preferences.savedSearchSuggestions,
    hotkey: "",
    savePreference: true
  },
  {
    id: "show-saved-searches",
    parentId: "bottom-panel-2",
    textContent: "Saved Searches",
    title: "Show saved searches",
    enabled: true,
    preference: Preferences.savedSearchesVisible,
    function: toggleSavedSearchesVisibility,
    triggerOnCreation: true
  },
  {
    id: "enable-gallery-menu",
    parentId: "favorite-options-right",
    textContent: "Gallery Menu",
    title: "Show menu in gallery",
    enabled: GALLERY_ENABLED && GeneralSettings.galleryMenuOptionEnabled,
    function: toggleGalleryMenuEnabled,
    preference: Preferences.galleryMenuEnabled,
    event: Events.favorites.galleryMenuToggled
  }
];

const simpleCheckboxes: Partial<CheckboxElement>[] = [
  {
    id: "sort-ascending",
    parentId: "sort-inputs",
    position: "beforeend",
    preference: Preferences.sortAscending,
    event: Events.favorites.sortAscendingToggled
  }
];

const selects: (Partial<SelectElement<LayoutMode>> | Partial<SelectElement<MetadataMetric>> | Partial<SelectElement<PerformanceProfile>>)[] = [
  {
    id: "sorting-method",
    parentId: "sort-inputs",
    title: "Change sorting order of search results",
    position: "beforeend",
    preference: Preferences.sortingMethod,
    event: Events.favorites.sortingMethodChanged,
    options: new Map<MetadataMetric, string>([
      ["default", "Default"],
      ["score", "Score"],
      ["width", "Width"],
      ["height", "Height"],
      ["creationTimestamp", "Date Uploaded"],
      ["lastChangedTimestamp", "Date Changed"],
      ["duration", "Duration"],
      ["id", "ID"],
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
    options: new Map<LayoutMode, string>([
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
    preference: Preferences.performanceProfile,
    event: Events.favorites.performanceProfileChanged,
    function: reloadWindow,
    isNumeric: true,
    options: new Map<PerformanceProfile, string>([
      [PerformanceProfile.NORMAL, "Normal"],
      [PerformanceProfile.MEDIUM, "Medium (no upscaling)"],
      [PerformanceProfile.LOW, "Low (no gallery)"],
      [PerformanceProfile.POTATO, "Potato (only search)"]
    ])
  }
];

const numbers: Partial<NumberElement>[] = [
  {
    id: "column-count",
    parentId: "column-count-container",
    position: "beforeend",
    preference: Preferences.columnCount,
    min: GeneralSettings.columnCountBounds.min,
    max: GeneralSettings.columnCountBounds.max,
    step: 1,
    pollingTime: 50,
    event: Events.favorites.columnCountChanged
  },

  {
    id: "row-size",
    parentId: "row-size-container",
    position: "beforeend",
    preference: Preferences.rowSize,
    min: GeneralSettings.rowSizeBounds.min,
    max: GeneralSettings.rowSizeBounds.max,
    step: 1,
    pollingTime: 50,
    event: Events.favorites.rowSizeChanged
  },

  {
    id: "results-per-page",
    parentId: "results-per-page-container",
    position: "beforeend",
    preference: Preferences.resultsPerPage,
    min: FavoritesSettings.resultsPerPageBounds.min,
    max: FavoritesSettings.resultsPerPageBounds.max,
    step: FavoritesSettings.resultsPerPageStep,
    pollingTime: 50,
    event: Events.favorites.resultsPerPageChanged
  }
];

export function createFavoritesDesktopMenuElements(): void {
  prepareDynamicElements(buttons).forEach(buildButtonElement);
  prepareDynamicElements(checkboxes).forEach(buildCheckboxOption);
  prepareDynamicElements(simpleCheckboxes).forEach(buildCheckboxElement);
  // @ts-expect-error don't care
  prepareDynamicElements(selects).forEach(buildSelectElement);
  prepareDynamicElements(numbers).forEach(buildNumberComponent);
}
