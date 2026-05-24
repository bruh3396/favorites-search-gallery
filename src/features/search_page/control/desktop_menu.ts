import { CheckboxElement, SelectElement } from "../../../types/element";
import { GALLERY_ENABLED, TOOLTIP_ENABLED } from "../../../app/context/flags";
import { Layout, PerformanceProfile } from "../../../types/ui";
import { Events } from "../../../app/channels/events";
import { GeneralConfig } from "../../../config/general_config";
import { MetadataMetric } from "../../../types/search";
import { ON_DESKTOP_DEVICE } from "../../../lib/environment/environment";
import { Preferences } from "../../../app/context/preferences";
import { buildCheckboxElement } from "../../../app/input/checkbox";
import { buildSelectElement } from "../../../lib/ui/elements/select";
import { numberRange } from "../../../utils/number";
import { prepareDynamicElements } from "../../../lib/ui/elements/dynamic_element_preparer";
import { reloadWindow } from "../../../utils/browser/window";
import { toggleAddOrRemoveButtons } from "../../../lib/ui/toggles";
import { toggleGalleryMenuEnabled } from "../../../lib/ui/style";

const checkboxes: Partial<CheckboxElement>[] = [
  {
    id: "search-page-upscale",
    parentId: "search-page-upscale-thumbs",
    position: "beforeend",
    title: "Upscale thumbnails on search pages",
    preference: Preferences.searchPageUpscaleThumbs,
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
    preference: Preferences.searchPageInfiniteScroll,
    event: Events.searchPage.infiniteScrollToggled,
    triggerOnCreation: true,
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
    id: "enable-tooltip",
    parentId: "search-page-tooltip",
    position: "beforeend",
    textContent: "Tooltip",
    title: "Enable tooltip",
    enabled: TOOLTIP_ENABLED,
    preference: Preferences.searchPageTooltipEnabled,
    hotkey: "",
    event: Events.favorites.tooltipToggled
  },
  {
    id: "show-add-favorite-buttons",
    parentId: "search-page-add-favorite-buttons",
    textContent: "Add Favorite Buttons",
    title: "Toggle add favorite buttons",
    position: "beforeend",
    preference: Preferences.searchPageAddButtonsVisible,
    triggerOnCreation: true,
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
    enabled: GALLERY_ENABLED && GeneralConfig.galleryMenuOptionEnabled,
    function: toggleGalleryMenuEnabled,
    preference: Preferences.galleryMenuEnabled,
    event: Events.favorites.galleryMenuToggled
  }
];
const selects: (Partial<SelectElement<Layout>> | Partial<SelectElement<MetadataMetric>> | Partial<SelectElement<PerformanceProfile>>)[] = [
  {
    id: "layout-select",
    parentId: "search-page-layout",
    title: "Change layout",
    position: "beforeend",
    preference: Preferences.searchPageLayout,
    event: Events.searchPage.layoutChanged,
    options: new Map<Layout, string>([
      ["tiler--native", "Native"],
      ["tiler--column", "Waterfall"],
      ["tiler--row", "River"],
      ["tiler--square", "Square"],
      ["tiler--grid", "Legacy"]
    ])
  },
  {
    id: "column-count",
    parentId: "search-page-column-count",
    position: "beforeend",
    preference: Preferences.searchPageColumnCount,
    event: Events.favorites.columnCountChanged,
    options: new Map<number, string>(numberRange(2, ON_DESKTOP_DEVICE ? 25 : 10).map(n => [n, String(n)]))
  },
  {
    id: "row-size",
    parentId: "search-page-row-size",
    position: "beforeend",
    preference: Preferences.searchPageRowSize,
    event: Events.favorites.rowSizeChanged,
    options: new Map<number, string>(numberRange(1, 10).map(n => [n, String(n)]))
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
      [PerformanceProfile.Normal, "Normal"],
      [PerformanceProfile.Medium, "Medium"],
      [PerformanceProfile.Low, "Low"],
      [PerformanceProfile.Potato, "Potato"]
    ])
  }
];

export function setup(): void {
  createCheckboxes();
  createSelects();
}

function createCheckboxes(): void {
  for (const checkbox of prepareDynamicElements(checkboxes)) {
    buildCheckboxElement(checkbox);
  }
}

function createSelects(): void {
  //  @ts-expect-error don't care
  for (const select of prepareDynamicElements(selects)) {
    buildSelectElement(select);
  }
}
