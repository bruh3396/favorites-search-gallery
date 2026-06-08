import { ON_FAVORITES_PAGE, ON_SEARCH_PAGE } from "@/lib/environment";
import { removeDataset, setDataset } from "@/utils/dom/attribute";
import { AbstractTiler } from "@/lib/ui/tilers/abstract_tiler";
import { ColumnTiler } from "@/lib/ui/tilers/column_tiler";
import { Content } from "@/app/layout/shell";
import { DomEvents } from "@/app/dom/events";
import { EnhancedWheelEvent } from "@/types/input";
import { Events } from "@/app/channels/events";
import { GridTiler } from "@/lib/ui/tilers/grid_tiler";
import { Layout } from "@/types/ui";
import { NativeTiler } from "@/lib/ui/tilers/native_tiler";
import { Preference } from "@/lib/storage/preference";
import { Preferences } from "@/app/context/preferences";
import { RowTiler } from "@/lib/ui/tilers/row_tiler";
import { SquareTiler } from "@/lib/ui/tilers/square_tiler";
import { ThumbConfig } from "@/config/thumb_config";
import { clamp } from "@/utils/number";
import { galleryIsIdle } from "@/app/channels/feature_bridge";
import { navigationDelta } from "@/utils/navigation";
import { yieldControl } from "@/lib/async/timing";

const columnTiler = new ColumnTiler(Content, ON_FAVORITES_PAGE ? Preferences.favoritesColumnCount.value : Preferences.searchPageColumnCount.value);
const tilers: AbstractTiler[] = [columnTiler, new GridTiler(Content), new RowTiler(Content), new SquareTiler(Content), new NativeTiler(Content)];
const tilerMap = new Map(tilers.map(tiler => [tiler.layout, tiler]));
let currentLayout: Layout = ON_FAVORITES_PAGE ? Preferences.favoritesLayout.value : Preferences.searchPageLayout.value;
let currentTiler: AbstractTiler = tilerMap.get(currentLayout) ?? columnTiler;

export function setup(): void {
  currentTiler.activate();
  setColumnCount(ON_SEARCH_PAGE ? Preferences.searchPageColumnCount.value : Preferences.favoritesColumnCount.value);
  setRowHeight(ON_SEARCH_PAGE ? Preferences.searchPageRowHeight.value : Preferences.favoritesRowHeight.value);
  DomEvents.document.wheel.on(changeItemSizeOnShiftScroll);
  Events.favorites.columnCountChanged.on(setColumnCount);
  Events.favorites.rowHeightChanged.on(setRowHeight);
  Events.favorites.layoutChanged.on(hideUnusedLayoutSizer);
  Events.searchPage.layoutChanged.on(hideUnusedLayoutSizer);
}

export function changeLayout(layout: Layout): void {
  if (currentLayout === layout) {
    return;
  }
  currentTiler.deactivate();
  currentLayout = layout;
  currentTiler = tilerMap.get(layout) ?? columnTiler;
  currentTiler.activate();
}

export const setRowHeight = (rowHeight: number): void => tilers.forEach(tiler => tiler.setRowHeight(rowHeight));

export function setColumnCount(columnCount: number): void {
  setDataset(Content, "suppressFade");
  tilers.forEach(tiler => tiler.setColumnCount(columnCount));
  requestAnimationFrame(() => requestAnimationFrame(() => removeDataset(Content, "suppressFade")));
}
export const getLayout = (): Layout => currentLayout;
export const tile = (items: HTMLElement[]): void => currentTiler.tile(items);
export const addToBottom = (items: HTMLElement[]): void => currentTiler.addItemsToBottom(items);
export const addToTop = (items: HTMLElement[]): void => currentTiler.addItemsToTop(items);
export const getBottomEdgeElements = (): HTMLElement[] => currentTiler.getBottomEdgeElements();

export function changeItemSizeOnShiftScroll(wheelEvent: EnhancedWheelEvent): void {
  if (!wheelEvent.originalEvent.shiftKey || currentLayout === "native" || !galleryIsIdle()) {
    return;
  }
  const usingRowLayout = currentLayout === "row";
  const direction = navigationDelta(wheelEvent.direction);
  const delta = usingRowLayout ? -direction : direction;
  let preference: Preference<number>;

  if (ON_FAVORITES_PAGE) {
    preference = usingRowLayout ? Preferences.favoritesRowHeight : Preferences.favoritesColumnCount;
  } else {
    preference = usingRowLayout ? Preferences.searchPageRowHeight : Preferences.searchPageColumnCount;
  }
  const bounds = usingRowLayout ? ThumbConfig.rowHeightBounds : ThumbConfig.columnCountBounds;

  preference.set(clamp(preference.value + delta, bounds.min, bounds.max));

  if (usingRowLayout) {
    setRowHeight(preference.value);
  } else {
    setColumnCount(preference.value);
  }
}

export async function hideUnusedLayoutSizer(layout: Layout): Promise<void> {
  await yieldControl();
  const rowHeightContainer = document.querySelector("#row-size-container, #search-page-row-size");
  const columnCountContainer = document.querySelector("#column-count-container, #search-page-column-count");

  if ((columnCountContainer instanceof HTMLElement) && (rowHeightContainer instanceof HTMLElement)) {
    rowHeightContainer.style.display = layout === "row" ? "" : "none";
    columnCountContainer.style.display = layout === "row" || layout === "native" ? "none" : "";
  }
}
