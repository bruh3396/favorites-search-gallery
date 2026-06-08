import { CheckboxElement, SelectElement } from "@/types/element";
import { FavoriteIndicatorStyle, GalleryFavoriteStyle, Layout, PerformanceProfile } from "@/types/ui";
import { GALLERY_ENABLED, TOOLTIP_ENABLED } from "@/app/context/flags";
import { Events } from "@/app/channels/events";
import { GeneralConfig } from "@/config/general_config";
import { MetadataMetric } from "@/types/search";
import { ON_DESKTOP_DEVICE } from "@/lib/environment";
import { Preferences } from "@/app/context/preferences";
import { buildCheckboxElement } from "@/app/dom/checkbox";
import { buildSelectElement } from "@/lib/ui/elements/select";
import { numberRange } from "@/utils/number";
import { prepareDynamicElements } from "@/lib/ui/elements/dynamic_element_preparer";
import { reloadWindow } from "@/utils/browser/window";
import { toggleAddOrRemoveButtons } from "@/lib/ui/toggles";
import { toggleGalleryMenuEnabled } from "@/lib/ui/style";

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
    preference: Preferences.galleryAutoplayActive,
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
  },
  {
    id: "favorite-indicator",
    parentId: "search-page-favorite-indicator",
    position: "beforeend",
    textContent: "",
    title: "Mark thumbs you've already favorited",
    preference: Preferences.searchPageFavoriteIndicator,
    event: Events.searchPage.favoriteIndicatorToggled,
    defaultValue: false
  }
];
const selects: (Partial<SelectElement<Layout>> | Partial<SelectElement<number>> | Partial<SelectElement<MetadataMetric>> | Partial<SelectElement<PerformanceProfile>> | Partial<SelectElement<FavoriteIndicatorStyle>> | Partial<SelectElement<GalleryFavoriteStyle>>)[] = [
  {
    id: "layout-select",
    parentId: "search-page-layout",
    title: "Change layout",
    position: "beforeend",
    preference: Preferences.searchPageLayout,
    event: Events.searchPage.layoutChanged,
    triggerOnCreation: true,
    options: new Map<Layout, string>([
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
    options: new Map<number, string>(numberRange(2, ON_DESKTOP_DEVICE ? 25 : 10).map(n => [n, String(n)]))
  },
  {
    id: "row-size",
    parentId: "search-page-row-size",
    position: "beforeend",
    preference: Preferences.searchPageRowHeight,
    event: Events.favorites.rowHeightChanged,
    options: new Map<number, string>(numberRange(1, 10).map(n => [n, String(n)]))
  },
  {
    id: "favorite-indicator-style",
    parentId: "search-page-favorite-indicator-style",
    position: "beforeend",
    preference: Preferences.searchPageFavoriteIndicatorStyle,
    event: Events.searchPage.favoriteIndicatorStyleChanged,
    options: new Map<FavoriteIndicatorStyle, string>([
      ["border", "Border"],
      ["dim", "Dim"],
      ["none", "None"],
      ["hidden", "Hidden"]
    ])
  },
  {
    id: "gallery-favorite-style",
    parentId: "search-page-gallery-favorite-style",
    position: "beforeend",
    preference: Preferences.searchPageGalleryFavoriteStyle,
    options: new Map<GalleryFavoriteStyle, string>([
      ["border", "Border"],
      ["glow", "Glow"],
      ["none", "None"]
    ])
  },
  {
    id: "performance-profile",
    parentId: "search-page-performance-profile",
    title: "Improve performance by disabling features",
    position: "beforeend",
    preference: Preferences.appPerformanceProfile,
    event: Events.favorites.performanceProfileChanged,
    function: reloadWindow,
    enabled: ON_DESKTOP_DEVICE,
    options: new Map<PerformanceProfile, string>([
      ["normal", "Normal"],
      ["medium", "Medium"],
      ["low", "Low"],
      ["potato", "Potato"]
    ])
  }
];

export function create(): void {
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
