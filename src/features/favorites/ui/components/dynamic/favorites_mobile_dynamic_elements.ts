import { ButtonElement, CheckboxElement, SelectElement } from "../../../../../types/elements/menu_element";
import { FavoriteLayout, MetadataMetric } from "../../../../../types/primitives/primitives";
import { hideUnusedLayoutSizer, toggleAddOrRemoveButtons, toggleDownloadButtons, toggleHeader } from "../../favorites_menu_event_handlers";
import { toggleDarkTheme, usingDarkTheme } from "../../../../../utils/dom/style";
import { Events } from "../../../../../lib/global/events/events";
import { GALLERY_ENABLED } from "../../../../../lib/global/flags/derived_flags";
import { PerformanceProfile } from "../../../../../types/primitives/enums";
import { Preferences } from "../../../../../lib/global/preferences/preferences";
import { USER_IS_ON_THEIR_OWN_FAVORITES_PAGE } from "../../../../../lib/global/flags/intrinsic_flags";
import { createButtonElement } from "../../../../../lib/ui/button";
import { createSelectElement } from "../../../../../lib/ui/select";
import { createToggleSwitch } from "../../../../../lib/ui/checkbox";
import { prepareDynamicElements } from "./favorites_dynamic_element_utils";

const BUTTONS: Partial<ButtonElement>[] = [
  {
    id: "download-button",
    parentId: "additional-favorite-options",
    textContent: "Download",
    title: "Download search results",
    event: Events.favorites.downloadButtonClicked,
    position: "beforeend"
  }
];

const TOGGLE_SWITCHES: Partial<CheckboxElement>[] = [
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
    id: "enable-autoplay",
    parentId: "favorite-options-left",
    textContent: "Autoplay",
    title: "Enable autoplay in gallery",
    enabled: GALLERY_ENABLED,
    preference: Preferences.autoplayActive,
    hotkey: "",
    event: Events.favorites.autoplayToggled
  },
  {
    id: "toggle-header",
    parentId: "favorite-options-left",
    textContent: "Header",
    title: "Toggle site header",
    preference: Preferences.headerEnabled,
    hotkey: "",
    enabled: false,
    event: Events.favorites.headerToggled,
    triggerOnCreation: true,
    function: toggleHeader
  },
  {
    id: "dark-theme",
    parentId: "favorite-options-left",
    textContent: "Dark Theme",
    title: "Toggle dark theme",
    defaultValue: usingDarkTheme(),
    hotkey: "",
    event: Events.favorites.darkThemeToggled,
    function: toggleDarkTheme
  },
    {
    id: "enhance-search-pages",
    parentId: "favorite-options-left",
    textContent: "Search Page Gallery",
    title: "Enable gallery and other features on search pages",
    preference: Preferences.searchPagesEnabled,
    hotkey: "",
    savePreference: true
  },
  {
    id: "sort-ascending",
    parentId: "sort-inputs",
    position: "beforeend",
    enabled: true,
    preference: Preferences.sortAscendingEnabled,
    event: Events.favorites.sortAscendingToggled
  },
  {
    id: "mobile-gallery",
    parentId: "favorite-options-left",
    textContent: "Gallery",
    title: "Enable gallery",
    position: "beforeend",
    enabled: true,
    preference: Preferences.mobileGalleryEnabled
  }
];

const SELECTS: (Partial<SelectElement<FavoriteLayout>> | Partial<SelectElement<number>> | Partial<SelectElement<MetadataMetric>> | Partial<SelectElement<PerformanceProfile>>)[] = [
  {
    id: "sorting-method",
    parentId: "sort-inputs",
    title: "Change sorting order of search results",
    position: "beforeend",
    preference: Preferences.sortingMethod,
    event: Events.favorites.sortingMethodChanged,
    options:
    {
      default: "Default",
      score: "Score",
      width: "Width",
      height: "Height",
      creationTimestamp: "Date Uploaded",
      lastChangedTimestamp: "Date Changed",
      id: "ID",
      random: "Random"
    }
  },
  {
    id: "layout-select",
    parentId: "layout-container",
    title: "Change layout",
    position: "beforeend",
    preference: Preferences.favoritesLayout,
    event: Events.favorites.layoutChanged,
    function: hideUnusedLayoutSizer,
    options:
    {
      column: "Waterfall",
      row: "River",
      square: "Square",
      grid: "Legacy"
    }
  },
  {
    id: "results-per-page", parentId: "results-per-page-container",
    title: "Change results per page",
    position: "beforeend",
    triggerOnCreation: true,
    preference: Preferences.resultsPerPage,
    event: Events.favorites.resultsPerPageChanged,
    options:
    {
      5: "5",
      10: "10",
      20: "20",
      50: "50",
      100: "100",
      200: "200",
      500: "500",
      1000: "1000"
    }
  },
  {
    id: "column-count",
    parentId: "column-count-container",
    position: "beforeend",
    preference: Preferences.columnCount,
    triggerOnCreation: true,
    event: Events.favorites.columnCountChanged,
    options: {
      1: "1",
      2: "2",
      3: "3",
      4: "4",
      5: "5",
      6: "6",
      7: "7",
      8: "8",
      9: "9",
      10: "10"
    }
  },
  {
    id: "row-size",
    parentId: "row-size-container",
    position: "beforeend",
    preference: Preferences.rowSize,
    triggerOnCreation: true,
    event: Events.favorites.rowSizeChanged,
    options: {
      2: "2",
      3: "3",
      4: "4",
      5: "5",
      6: "6",
      7: "7"
    }
  }
];

function createButtons(): void {
  for (const button of prepareDynamicElements(BUTTONS)) {
    createButtonElement(button);
  }
}

function createToggleSwitches(): void {
  for (const checkbox of prepareDynamicElements(TOGGLE_SWITCHES)) {
    createToggleSwitch(checkbox);
  }
}

function createSelects(): void {
  for (const select of prepareDynamicElements(SELECTS)) {
    // @ts-expect-error could be SelectElement<FavoriteLayout> | SelectElement<MetadataMetric> | SelectElement<PerformanceProfile>
    createSelectElement(select);
  }
}

export function createDynamicFavoritesMobileMenuElements(): void {
  createSelects();
  createToggleSwitches();
  hideUnusedLayoutSizer(Preferences.favoritesLayout.value);
  createButtons();
}
