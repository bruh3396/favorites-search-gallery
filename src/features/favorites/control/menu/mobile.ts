import { ButtonElement, CheckboxElement, SelectElement } from "../../../../types/element";
import { Layout, PerformanceProfile } from "../../../../types/ui";
import { toggleAddOrRemoveButtons, toggleDownloadButtons, toggleHeader } from "../../../../lib/ui/toggles";
import { toggleDarkTheme, usingDarkTheme } from "../../../../lib/ui/style";
import { Events } from "../../../../app/channels/events";
import { GALLERY_ENABLED } from "../../../../app/context/flags";
import { MetadataMetric } from "../../../../types/search";
import { Preferences } from "../../../../app/context/preferences";
import { USER_IS_ON_THEIR_OWN_FAVORITES_PAGE } from "../../../../lib/environment";
import { buildButtonElement } from "../../../../lib/ui/elements/button";
import { buildSelectElement } from "../../../../lib/ui/elements/select";
import { buildToggleSwitch } from "../../../../app/input/checkbox";
import { hideUnusedLayoutSizer } from "../../../../app/layout/content_tiler";
import { prepareDynamicElements } from "../../../../lib/ui/elements/dynamic_element_preparer";

const buttons: Partial<ButtonElement>[] = [
  {
    id: "download-button",
    parentId: "additional-favorite-options",
    textContent: "Download",
    title: "Download search results",
    event: Events.favorites.downloadButtonClicked,
    position: "beforeend"
  }
];

const toggleSwitches: Partial<CheckboxElement>[] = [
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
    id: "show-download-buttons",
    parentId: "favorite-options-left",
    textContent: "Download Buttons",
    title: "Toggle download buttons",
    enabled: true,
    preference: Preferences.downloadButtonsVisible,
    hotkey: "",
    function: toggleDownloadButtons,
    event: Events.favorites.downloadButtonsToggled,
    triggerOnCreation: true
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
    preference: Preferences.sortAscending,
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

const selects: (Partial<SelectElement<Layout>> | Partial<SelectElement<number>> | Partial<SelectElement<MetadataMetric>> | Partial<SelectElement<PerformanceProfile>>)[] = [
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
      ["random", "Random"],
      ["duration", "Duration"]
    ])
  },
  {
    id: "layout-select",
    parentId: "layout-container",
    title: "Change layout",
    position: "beforeend",
    preference: Preferences.favoritesLayout,
    event: Events.favorites.layoutChanged,
    triggerOnCreation: true,
    function: hideUnusedLayoutSizer,
    options: new Map<Layout, string>([
      ["tiler--column", "Waterfall"],
      ["tiler--row", "River"],
      ["tiler--square", "Square"],
      ["tiler--grid", "Legacy"]
    ])
  },
  {
    id: "results-per-page", parentId: "results-per-page-container",
    title: "Change results per page",
    position: "beforeend",
    preference: Preferences.resultsPerPage,
    event: Events.favorites.resultsPerPageChanged,
    options: new Map<number, string>([
      [5, "5"],
      [10, "10"],
      [20, "20"],
      [50, "50"],
      [100, "100"],
      [200, "200"],
      [500, "500"],
      [1_000, "1000"]
    ])
  },
  {
    id: "column-count",
    parentId: "column-count-container",
    position: "beforeend",
    preference: Preferences.columnCount,
    event: Events.favorites.columnCountChanged,
    options: new Map<number, string>([
      [1, "1"],
      [2, "2"],
      [3, "3"],
      [4, "4"],
      [5, "5"],
      [6, "6"],
      [7, "7"],
      [8, "8"],
      [9, "9"],
      [10, "10"]
    ])
  },
  {
    id: "row-size",
    parentId: "row-size-container",
    position: "beforeend",
    preference: Preferences.rowSize,
    event: Events.favorites.rowSizeChanged,
    options: new Map<number, string>([
      [1, "1"],
      [2, "2"],
      [3, "3"],
      [4, "4"],
      [5, "5"],
      [6, "6"],
      [7, "7"]
    ])
  }
];

export function setup(): void {
  prepareDynamicElements(buttons).forEach(buildButtonElement);
  prepareDynamicElements(toggleSwitches).forEach(buildToggleSwitch);
  // @ts-expect-error don't care
  prepareDynamicElements(selects).forEach(buildSelectElement);
}
