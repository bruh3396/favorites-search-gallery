import { ButtonElement, CheckboxElement, NumberElement, SelectElement } from "../../../../../types/element_types";
import { CAPTIONS_ENABLED, GALLERY_ENABLED, TOOLTIP_ENABLED } from "../../../../../lib/global/flags/derived_flags";
import { Layout, MetadataMetric, PerformanceProfile } from "../../../../../types/common_types";
import { createCheckboxElement, createCheckboxOption } from "../../../../../lib/ui/checkbox";
import { reloadWindow, toggleGalleryMenuEnabled } from "../../../../../utils/dom/dom";
import { toggleAddOrRemoveButtons, toggleDownloadButtons, toggleHeader } from "../../../../../utils/dom/ui_element_utils";
import { toggleDarkTheme, usingDarkTheme } from "../../../../../utils/dom/style";
import { toggleFavoritesOptions, toggleOptionHotkeyHints, toggleUI } from "../../favorites_menu_event_handlers";
import { Events } from "../../../../../lib/global/events/events";
import { FavoritesSettings } from "../../../../../config/favorites_settings";
import { GeneralSettings } from "../../../../../config/general_settings";
import { Preferences } from "../../../../../lib/global/preferences/preferences";
import { USER_IS_ON_THEIR_OWN_FAVORITES_PAGE } from "../../../../../lib/global/flags/intrinsic_flags";
import { createButtonElement } from "../../../../../lib/ui/button";
import { createNumberComponent } from "../../../../../lib/ui/number";
import { createSelectElement } from "../../../../../lib/ui/select";
import { hideUnusedLayoutSizer } from "../../../../../lib/global/content/tilers/tiler_event_handlers";
import { prepareDynamicElements } from "../../../../../lib/ui/element_utils";
import { tryResetting } from "../../../../../lib/flows/reset";

const BUTTONS: Partial<ButtonElement>[] = [
  {
    id: "search-button", parentId: "left-favorites-panel-top-row",
    title: "Search favorites\nctrl+click/right-click: Search all of rule34 in a new tab",
    position: "afterbegin",
    textContent: "Search",
    rightClickEnabled: true,
    event: Events.favorites.searchButtonClicked
  },
  {
    id: "shuffle-button",
    parentId: "left-favorites-panel-top-row",
    textContent: "Shuffle",
    title: "Randomize order of search results",
    event: Events.favorites.shuffleButtonClicked
  },
  {
    id: "invert-button",
    parentId: "left-favorites-panel-top-row",
    textContent: "Invert",
    title: "Show results not matched by latest search",
    event: Events.favorites.invertButtonClicked
  },
  {
    id: "clear-button",
    parentId: "left-favorites-panel-top-row",
    textContent: "Clear",
    title: "Empty the search box",
    event: Events.favorites.clearButtonClicked
  },
  {
    id: "download-button",
    parentId: "left-favorites-panel-top-row",
    textContent: "Download",
    title: "Download search results (experimental)",
    event: Events.favorites.downloadButtonClicked
  },
  {
    id: "subset-button",
    parentId: "left-favorites-panel-top-row",
    textContent: "Set Subset",
    title: "Make the current search results the entire set of results to search from",
    enabled: false,
    event: Events.favorites.searchSubsetClicked
  },
  {
    id: "stop-subset-button",
    parentId: "left-favorites-panel-top-row",
    textContent: "Stop Subset",
    title: "Stop subset and return entire set of results to all favorites",
    enabled: false,
    event: Events.favorites.stopSearchSubsetClicked
  },
  {
    id: "reset-button",
    parentId: "left-favorites-panel-top-row",
    textContent: "Reset",
    title: "Delete cached favorites and reset preferences",
    function: tryResetting,
    event: Events.favorites.resetButtonClicked
  }

];

const CHECKBOXES: Partial<CheckboxElement>[] = [
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
    preference: Preferences.searchPagesEnabled,
    hotkey: "",
    savePreference: true
  },
  {
    id: "infinite-scroll",
    parentId: "favorite-options-left",
    textContent: "Infinite Scroll",
    title: "Use infinite scroll (waterfall) instead of pages",
    preference: Preferences.infiniteScrollEnabled,
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
    event: Events.favorites.removeButtonsToggled
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
    event: Events.favorites.addButtonsToggled
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
    event: Events.favorites.downloadButtonsToggled
  },
  {
    id: "exclude-blacklist",
    parentId: "favorite-options-left",
    textContent: "Exclude Blacklist",
    title: "Exclude favorites with blacklisted tags from search",
    enabled: USER_IS_ON_THEIR_OWN_FAVORITES_PAGE,
    preference: Preferences.excludeBlacklistEnabled,
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
    preference: Preferences.showOnHoverEnabled,
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
    preference: Preferences.tagAliasingEnabled,
    hotkey: "A"
  },
  {
    id: "show-saved-search-suggestions",
    parentId: "favorite-options-right",
    textContent: "Saved Suggestions",
    title: "Show saved search suggestions in autocomplete dropdown",
    enabled: false,
    preference: Preferences.savedSearchSuggestionsEnabled,
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
    event: Events.favorites.savedSearchesToggled
  },
  {
    id: "enable-gallery-menu",
    parentId: "favorite-options-left",
    textContent: "Gallery Menu",
    title: "Show menu in gallery",
    enabled: GALLERY_ENABLED && GeneralSettings.galleryMenuOptionEnabled,
    function: toggleGalleryMenuEnabled,
    preference: Preferences.galleryMenuEnabled,
    event: Events.favorites.galleryMenuToggled
  }
];

const SIMPLE_CHECKBOXES: Partial<CheckboxElement>[] = [
  {
    id: "sort-ascending",
    parentId: "sort-inputs",
    position: "beforeend",
    preference: Preferences.sortAscendingEnabled,
    event: Events.favorites.sortAscendingToggled
  }
];

const SELECTS: (Partial<SelectElement<Layout>> | Partial<SelectElement<MetadataMetric>> | Partial<SelectElement<PerformanceProfile>>)[] = [
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

const NUMBERS: Partial<NumberElement>[] = [
  {
    id: "column-count",
    parentId: "column-count-container",
    position: "beforeend",
    preference: Preferences.columnCount,
    min: GeneralSettings.columnCountBounds.min,
    max: GeneralSettings.columnCountBounds.max,
    step: 1,
    pollingTime: 50,
    triggerOnCreation: true,
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
    triggerOnCreation: true,
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
    triggerOnCreation: false,
    event: Events.favorites.resultsPerPageChanged
  }
];

function createButtons(): void {
  for (const button of prepareDynamicElements(BUTTONS)) {
    createButtonElement(button);
  }
}

function createCheckboxes(): void {
  for (const checkbox of prepareDynamicElements(CHECKBOXES)) {
    createCheckboxOption(checkbox);
  }
}

function createSelects(): void {
  //  @ts-expect-error don't care
  for (const select of prepareDynamicElements(SELECTS)) {
    createSelectElement(select);
  }
}

function createNumbers(): void {
  for (const number of prepareDynamicElements(NUMBERS)) {
    createNumberComponent(number);
  }
}

function createSimpleCheckboxes(): void {
  for (const checkbox of prepareDynamicElements(SIMPLE_CHECKBOXES)) {
    createCheckboxElement(checkbox);
  }
}

export function createDynamicFavoritesDesktopMenuElements(): void {
  createButtons();
  createCheckboxes();
  createSimpleCheckboxes();
  createSelects();
  createNumbers();
}
