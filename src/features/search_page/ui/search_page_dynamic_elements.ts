import { CheckboxElement, NumberElement, SelectElement } from "../../../types/element_types";
import { LayoutMode, MetadataMetric, PerformanceProfile } from "../../../types/common_types";
import { reloadWindow } from "../../../utils/browser/window";
import { toggleGalleryMenuEnabled } from "../../../lib/style";
import { Events } from "../../../lib/events/events";
import { GALLERY_ENABLED } from "../../../lib/environment/derived_environment";
import { GeneralSettings } from "../../../config/general_settings";
import { ON_DESKTOP_DEVICE } from "../../../lib/environment/environment";
import { Preferences } from "../../../lib/preferences/preferences";
import { createCheckboxElement } from "../../../lib/ui/elements/checkbox";
import { createNumberComponent } from "../../../lib/ui/elements/number_input";
import { createSelectElement } from "../../../lib/ui/elements/select";
import { getNumberRange } from "../../../utils/number";
import { prepareDynamicElements } from "../../../lib/ui/elements/element_utils";
import { toggleAddOrRemoveButtons } from "../../../lib/ui/toggles";

const CHECKBOXES: Partial<CheckboxElement>[] = [
  {
    id: "search-page-upscale",
    parentId: "search-page-upscale-thumbs",
    position: "beforeend",
    title: "Upscale thumbnails on search pages",
    preference: Preferences.upscaleThumbsOnSearchPage,
    event: Events.searchPage.upscaleToggled,
    textContent: "",
    enabled: ON_DESKTOP_DEVICE,
    defaultValue: false
  },
  {
    id: "search-page-inf-scroll",
    parentId: "search-page-infinite-scroll",
    position: "beforeend",
    title: "Enable infinite scroll",
    preference: Preferences.searchPageInfiniteScrollEnabled,
    event: Events.searchPage.infiniteScrollToggled,
    textContent: "",
    defaultValue: false
  },
  {
    id: "enable-autoplay",
    parentId: "search-page-autoplay",
    position: "beforeend",
    textContent: "Autoplay",
    title: "Enable autoplay in gallery",
    enabled: GALLERY_ENABLED,
    preference: Preferences.autoplayActive,
    hotkey: "",
    event: Events.favorites.autoplayToggled
  },
  {
    id: "show-add-favorite-buttons",
    parentId: "search-page-add-favorite-buttons",
    textContent: "Add Favorite Buttons",
    title: "Toggle add favorite buttons",
    position: "beforeend",
    preference: Preferences.searchPageAddButtonsVisible,
    function: toggleAddOrRemoveButtons,
    hotkey: "R",
    event: Events.favorites.addButtonsToggled
  },
  {
    id: "enable-gallery-menu",
    parentId: "search-page-gallery-menu",
    textContent: "Gallery Menu",
    title: "Show menu in gallery",
    position: "beforeend",
    enabled: GALLERY_ENABLED && GeneralSettings.galleryMenuOptionEnabled,
    function: toggleGalleryMenuEnabled,
    preference: Preferences.galleryMenuEnabled,
    event: Events.favorites.galleryMenuToggled
  }
];
const SELECTS: (Partial<SelectElement<LayoutMode>> | Partial<SelectElement<MetadataMetric>> | Partial<SelectElement<PerformanceProfile>>)[] = [
  {
    id: "layout-select",
    parentId: "search-page-layout",
    title: "Change layout",
    position: "beforeend",
    preference: Preferences.searchPageLayout,
    event: Events.searchPage.layoutChanged,
    options: new Map<LayoutMode, string>([
      ["native", "Native"],
      ["column", "Waterfall"],
      ["row", "River"],
      ["square", "Square"],
      ["grid", "Legacy"]
    ])
  },
  {
    id: "column-count",
    parentId: "search-page-column-count",
    position: "beforeend",
    preference: Preferences.searchPageColumnCount,
    event: Events.favorites.columnCountChanged,
    options: new Map<number, string>(getNumberRange(2, ON_DESKTOP_DEVICE ? 25 : 10).map(n => [n, String(n)]))
  },
  {
    id: "row-size",
    parentId: "search-page-row-size",
    position: "beforeend",
    preference: Preferences.searchPageRowSize,
    event: Events.favorites.rowSizeChanged,
    options: new Map<number, string>(getNumberRange(1, 10).map(n => [n, String(n)]))
  },
  {
    id: "performance-profile",
    parentId: "search-page-performance-profile",
    title: "Improve performance by disabling features",
    position: "beforeend",
    preference: Preferences.performanceProfile,
    event: Events.favorites.performanceProfileChanged,
    function: reloadWindow,
    enabled: ON_DESKTOP_DEVICE,
    isNumeric: true,
    options: new Map<PerformanceProfile, string>([
      [PerformanceProfile.NORMAL, "Normal"],
      [PerformanceProfile.MEDIUM, "Medium"],
      [PerformanceProfile.LOW, "Low"],
      [PerformanceProfile.POTATO, "Potato"]
    ])
  }
];
const NUMBERS: Partial<NumberElement>[] = [];

function createCheckboxes(): void {
  for (const checkbox of prepareDynamicElements(CHECKBOXES)) {
    createCheckboxElement(checkbox);
  }
}

function createNumbers(): void {
  for (const number of prepareDynamicElements(NUMBERS)) {
    createNumberComponent(number);
  }
}

function createSelects(): void {
  //  @ts-expect-error don't care
  for (const select of prepareDynamicElements(SELECTS)) {
    createSelectElement(select);
  }
}

export function createDynamicSearchPageMenuElements(): void {
  createCheckboxes();
  createSelects();
  createNumbers();
}
