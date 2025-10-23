import { CheckboxElement, NumberElement, SelectElement } from "../../../types/element_types";
import { Layout, MetadataMetric, PerformanceProfile } from "../../../types/common_types";
import { Events } from "../../../lib/global/events/events";
import { ON_DESKTOP_DEVICE } from "../../../lib/global/flags/intrinsic_flags";
import { Preferences } from "../../../lib/global/preferences/preferences";
import { createCheckboxElement } from "../../../lib/ui/checkbox";
import { createNumberComponent } from "../../../lib/ui/number";
import { createSelectElement } from "../../../lib/ui/select";
import { prepareDynamicElements } from "../../../lib/ui/element_utils";

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
  }
];
const SELECTS: (Partial<SelectElement<Layout>> | Partial<SelectElement<MetadataMetric>> | Partial<SelectElement<PerformanceProfile>>)[] = [
  {
    id: "layout-select",
    parentId: "search-page-layout",
    title: "Change layout",
    position: "beforeend",
    preference: Preferences.searchPageLayout,
    event: Events.searchPage.layoutChanged,
    options: new Map<Layout, string>([
      ["column", "Waterfall"],
      ["row", "River"],
      ["square", "Square"],
      ["grid", "Legacy"],
      ["native", "Native"]
    ])
  },
  {
    id: "column-count",
    parentId: "search-page-column-count",
    position: "beforeend",
    preference: Preferences.columnCount,
    event: Events.favorites.columnCountChanged,
    options: new Map<number, string>(Array.from({ length: ON_DESKTOP_DEVICE ? 25 : 10 }, (_, i) => [i + 1, String(i + 1)]))
  },
  {
    id: "row-size",
    parentId: "search-page-row-size",
    position: "beforeend",
    preference: Preferences.rowSize,
    event: Events.favorites.rowSizeChanged,
    options: new Map<number, string>(Array.from({ length: 7 }, (_, i) => [i + 1, String(i + 1)]))
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
