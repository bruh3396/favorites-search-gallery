import { ON_FAVORITES_PAGE, ON_SEARCH_PAGE } from "@/lib/environment";
import { AbstractTiler } from "@/lib/ui/tilers/abstract_tiler";
import { ColumnTiler } from "@/lib/ui/tilers/column_tiler";
import { Content } from "@/app/layout/shell";
import { DomEvents } from "@/app/dom/events";
import { EnhancedWheelEvent } from "@/types/input";
import { Events } from "@/app/channels/events";
import { FeatureBridge } from "@/app/channels/feature_bridge";
import { GridTiler } from "@/lib/ui/tilers/grid_tiler";
import { Layout } from "@/types/ui";
import { NativeTiler } from "@/lib/ui/tilers/native_tiler";
import { Preferences } from "@/app/context/preferences";
import { RowTiler } from "@/lib/ui/tilers/row_tiler";
import { SquareTiler } from "@/lib/ui/tilers/square_tiler";
import { clamp } from "@/utils/number";
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
  setRowSize(ON_SEARCH_PAGE ? Preferences.searchPageRowHeight.value : Preferences.favoritesRowHeight.value);
  DomEvents.document.wheel.on(changeItemSizeOnShiftScroll);
  Events.favorites.columnCountChanged.on(setColumnCount);
  Events.favorites.rowSizeChanged.on(setRowSize);
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

export const setRowSize = (rowSize: number): void => tilers.forEach(tiler => tiler.setRowSize(rowSize));
export const setColumnCount = (columnCount: number): void => tilers.forEach(tiler => tiler.setColumnCount(columnCount));
export const getLayout = (): Layout => currentLayout;
export const tile = (items: HTMLElement[]): void => currentTiler.tile(items);
export const addToBottom = (items: HTMLElement[]): void => currentTiler.addItemsToBottom(items);
export const addToTop = (items: HTMLElement[]): void => currentTiler.addItemsToTop(items);
export const getBottomEdgeElements = (): HTMLElement[] => currentTiler.getBottomEdgeElements();

export function changeItemSizeOnShiftScroll(wheelEvent: EnhancedWheelEvent): void {
  if (!wheelEvent.originalEvent.shiftKey || currentLayout === "native" || FeatureBridge.inGallery.call()) {
    return;
  }
  const usingRowLayout = currentLayout === "row";
  const input = document.getElementById(usingRowLayout ? "row-size" : "column-count");

  if (!(input instanceof HTMLInputElement) && !(input instanceof HTMLSelectElement)) {
    return;
  }
  const direction = navigationDelta(wheelEvent.direction);
  const delta = usingRowLayout ? -direction : direction;
  let value = parseInt(input.value, 10) + delta;

  if (input instanceof HTMLSelectElement) {
    const smallestOption = parseInt(input.querySelector("option")?.value ?? "1");
    const largestOption = parseInt((input.querySelector("option:last-child") as HTMLOptionElement)?.value ?? "1");

    value = clamp(value, smallestOption, largestOption);
  }
  input.value = String(value);
  input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

export async function hideUnusedLayoutSizer(layout: Layout): Promise<void> {
  await yieldControl();
  const rowSizeContainer = document.querySelector("#row-size-container, #search-page-row-size");
  const columnCountContainer = document.querySelector("#column-count-container, #search-page-column-count");

  if ((columnCountContainer instanceof HTMLElement) && (rowSizeContainer instanceof HTMLElement)) {
    rowSizeContainer.style.display = layout === "row" ? "" : "none";
    columnCountContainer.style.display = layout === "row" || layout === "native" ? "none" : "";
  }
}
