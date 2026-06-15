import { CheckboxElement, SelectElement } from "@/types/element";
import { GALLERY_ENABLED, TOOLTIP_ENABLED } from "@/app/context/flags";
import { HighlightStyle, Layout, PerformanceProfile } from "@/types/app";
import { GeneralConfig } from "@/config/general_config";
import { MetadataMetric } from "@/types/search";
import { ON_DESKTOP_DEVICE } from "@/lib/environment";
import { Preferences } from "@/app/context/preferences";
import { buildCheckboxElement } from "@/app/dom/checkbox";
import { buildSelectElement } from "@/lib/ui/elements/select";
import { numberRange } from "@/utils/number";
import { prepareDynamicElements } from "@/lib/ui/elements/dynamic_element_preparer";
import { reloadWindow } from "@/utils/browser/window";
import { toggleGalleryMenuEnabled } from "@/lib/ui/toggles";

const checkboxes: Partial<CheckboxElement>[] = [
  {
    id: "post-list-upscale",
    parentId: "post-list-upscale-thumbs",
    position: "beforeend",
    title: "Upscale thumbnails on search pages",
    preference: Preferences.postList.upscaleThumbs,
    textContent: "",
    enabled: ON_DESKTOP_DEVICE,
    defaultValue: false
  },
  {
    id: "post-list-inf-scroll",
    parentId: "post-list-infinite-scroll",
    position: "beforeend",
    title: "Enable infinite scroll",
    preference: Preferences.postList.infiniteScroll,
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
    preference: Preferences.gallery.autoplayActive,
    hotkey: ""
  },
  {
    id: "enable-tooltip",
    parentId: "post-list-tooltip",
    position: "beforeend",
    textContent: "Tooltip",
    title: "Enable tooltip",
    enabled: TOOLTIP_ENABLED,
    preference: Preferences.postList.tooltipEnabled,
    hotkey: ""
  },
  {
    id: "enable-gallery-menu",
    parentId: "post-list-gallery-menu",
    textContent: "Gallery Menu",
    title: "Show menu in gallery",
    position: "beforeend",
    enabled: GALLERY_ENABLED && GeneralConfig.galleryMenuOptionEnabled,
    function: toggleGalleryMenuEnabled,
    preference: Preferences.gallery.menuEnabled
  },
  {
    id: "favorite-indicator",
    parentId: "post-list-favorite-indicator",
    position: "beforeend",
    textContent: "",
    title: "Mark thumbs you've already favorited",
    preference: Preferences.postList.favoriteIndicator,
    defaultValue: false
  }
];

const selects: (
  Partial<SelectElement<Layout>> |
  Partial<SelectElement<number>> |
  Partial<SelectElement<MetadataMetric>> |
  Partial<SelectElement<PerformanceProfile>> |
  Partial<SelectElement<HighlightStyle>>
)[] = [
    {
      id: "layout-select",
      parentId: "post-list-layout",
      title: "Change layout",
      position: "beforeend",
      preference: Preferences.postList.layout,
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
      preference: Preferences.postList.columnCount,
      options: new Map<number, string>(numberRange(2, ON_DESKTOP_DEVICE ? 25 : 10).map(n => [n, String(n)]))
    },
    {
      id: "row-size",
      parentId: "post-list-row-size",
      position: "beforeend",
      preference: Preferences.postList.rowHeight,
      options: new Map<number, string>(numberRange(1, 10).map(n => [n, String(n)]))
    },
    {
      id: "favorite-indicator-style",
      parentId: "post-list-favorite-indicator-style",
      position: "beforeend",
      preference: Preferences.postList.favoriteIndicatorStyle,
      options: new Map<HighlightStyle, string>([
        ["border", "Border"],
        ["glow", "Glow"],
        ["trace", "Trace"],
        ["hidden", "Hidden"],
        ["none", "None"]
      ])
    },
    {
      id: "gallery-favorite-style",
      parentId: "post-list-gallery-favorite-style",
      position: "beforeend",
      preference: Preferences.postList.galleryFavoriteStyle,
      options: new Map<HighlightStyle, string>([
        ["border", "Border"],
        ["glow", "Glow"],
        ["trace", "Trace"],
        ["none", "None"]
      ])
    },
    {
      id: "performance-profile",
      parentId: "post-list-performance-profile",
      title: "Improve performance by disabling features",
      position: "beforeend",
      preference: Preferences.app.performanceProfile,
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

export function build(): void {
  buildCheckboxes();
  buildSelects();
}

function buildCheckboxes(): void {
  for (const checkbox of prepareDynamicElements(checkboxes)) {
    buildCheckboxElement(checkbox);
  }
}

function buildSelects(): void {
  //  @ts-expect-error don't care
  for (const select of prepareDynamicElements(selects)) {
    buildSelectElement(select);
  }
}
