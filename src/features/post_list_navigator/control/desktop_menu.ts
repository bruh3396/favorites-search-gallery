import { CheckboxElement, SelectElement } from "@/types/element";
import { FavoriteIndicatorStyle, GalleryFavoriteIndicatorStyle, Layout, PerformanceProfile } from "@/types/ui";
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
import { toggleGalleryMenuEnabled } from "@/lib/ui/style";

const checkboxes: Partial<CheckboxElement>[] = [
  {
    id: "post-list-upscale",
    parentId: "post-list-upscale-thumbs",
    position: "beforeend",
    title: "Upscale thumbnails on search pages",
    preference: Preferences.postListUpscaleThumbs,
    event: Events.postList.upscaleToggled,
    textContent: "",
    enabled: ON_DESKTOP_DEVICE,
    defaultValue: false
  },
  {
    id: "post-list-inf-scroll",
    parentId: "post-list-infinite-scroll",
    position: "beforeend",
    title: "Enable infinite scroll",
    preference: Preferences.postListInfiniteScroll,
    event: Events.postList.infiniteScrollToggled,
    triggerOnCreation: true,
    textContent: "",
    defaultValue: false
  },
  {
    id: "enable-autoplay",
    parentId: "post-list-autoplay",
    position: "beforeend",
    textContent: "Autoplay",
    title: "Enable autoplay in gallery",
    enabled: GALLERY_ENABLED,
    preference: Preferences.galleryAutoplayActive,
    hotkey: "",
    event: Events.app.autoplayToggled
  },
  {
    id: "enable-tooltip",
    parentId: "post-list-tooltip",
    position: "beforeend",
    textContent: "Tooltip",
    title: "Enable tooltip",
    enabled: TOOLTIP_ENABLED,
    preference: Preferences.postListTooltipEnabled,
    hotkey: "",
    event: Events.app.tooltipToggled
  },
  {
    id: "enable-gallery-menu",
    parentId: "post-list-gallery-menu",
    textContent: "Gallery Menu",
    title: "Show menu in gallery",
    position: "beforeend",
    enabled: GALLERY_ENABLED && GeneralConfig.galleryMenuOptionEnabled,
    function: toggleGalleryMenuEnabled,
    preference: Preferences.galleryMenuEnabled,
    event: Events.app.galleryMenuToggled
  },
  {
    id: "favorite-indicator",
    parentId: "post-list-favorite-indicator",
    position: "beforeend",
    textContent: "",
    title: "Mark thumbs you've already favorited",
    preference: Preferences.postListFavoriteIndicator,
    event: Events.postList.favoriteIndicatorToggled,
    defaultValue: false
  }
];
const selects: (Partial<SelectElement<Layout>> | Partial<SelectElement<number>> | Partial<SelectElement<MetadataMetric>> | Partial<SelectElement<PerformanceProfile>> | Partial<SelectElement<FavoriteIndicatorStyle>> | Partial<SelectElement<GalleryFavoriteIndicatorStyle>>)[] = [
  {
    id: "layout-select",
    parentId: "post-list-layout",
    title: "Change layout",
    position: "beforeend",
    preference: Preferences.postListLayout,
    event: Events.postList.layoutChanged,
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
    parentId: "post-list-column-count",
    position: "beforeend",
    preference: Preferences.postListColumnCount,
    event: Events.app.columnCountChanged,
    options: new Map<number, string>(numberRange(2, ON_DESKTOP_DEVICE ? 25 : 10).map(n => [n, String(n)]))
  },
  {
    id: "row-size",
    parentId: "post-list-row-size",
    position: "beforeend",
    preference: Preferences.postListRowHeight,
    event: Events.app.rowHeightChanged,
    options: new Map<number, string>(numberRange(1, 10).map(n => [n, String(n)]))
  },
  {
    id: "favorite-indicator-style",
    parentId: "post-list-favorite-indicator-style",
    position: "beforeend",
    preference: Preferences.postListFavoriteIndicatorStyle,
    event: Events.postList.favoriteIndicatorStyleChanged,
    options: new Map<FavoriteIndicatorStyle, string>([
      ["border", "Border"],
      ["dim", "Dim"],
      ["none", "None"],
      ["hidden", "Hidden"]
    ])
  },
  {
    id: "gallery-favorite-style",
    parentId: "post-list-gallery-favorite-style",
    position: "beforeend",
    preference: Preferences.postListGalleryFavoriteStyle,
    options: new Map<GalleryFavoriteIndicatorStyle, string>([
      ["border", "Border"],
      ["glow", "Glow"],
      ["none", "None"]
    ])
  },
  {
    id: "performance-profile",
    parentId: "post-list-performance-profile",
    title: "Improve performance by disabling features",
    position: "beforeend",
    preference: Preferences.appPerformanceProfile,
    event: Events.app.performanceProfileChanged,
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
