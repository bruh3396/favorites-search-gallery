import { changeItemSizeOnShiftScroll, hideUnusedLayoutSizer } from "./tiler_event_handlers";
import { CONTENT_CONTAINER } from "../content_container";
import { ColumnTiler } from "./column_tiler";
import { Events } from "../../events/events";
import { GridTiler } from "./grid_tiler";
import { Layout } from "../../../../types/common_types";
import { NativeTiler } from "./native_tiler";
import { ON_FAVORITES_PAGE } from "../../flags/intrinsic_flags";
import { Preferences } from "../../preferences/preferences";
import { RowTiler } from "./row_tiler";
import { SquareTiler } from "./square_tiler";
import { Tiler } from "./tiler_interface";

const TILERS = [
  new ColumnTiler(),
  new GridTiler(),
  new RowTiler(),
  new SquareTiler(),
  new NativeTiler()
];

let currentLayout: Layout = ON_FAVORITES_PAGE ? Preferences.favoritesLayout.value : Preferences.searchPageLayout.value;

export function getCurrentTiler(): Tiler {
  return TILERS.find(tiler => tiler.className === currentLayout) ?? TILERS[0];
}

export function getCurrentLayout(): Layout {
  return currentLayout;
}

export function tile(items: HTMLElement[]): void {
  getCurrentTiler().tile(items);
}

export function addItemsToBottom(items: HTMLElement[]): void {
  getCurrentTiler().addItemsToBottom(items);
}

export function addItemsToTop(items: HTMLElement[]): void {
  getCurrentTiler().addItemsToTop(items);
}

export function changeLayout(layout: Layout): void {
  if (currentLayout === layout) {
    return;
  }
  getCurrentTiler().onDeactivate();
  CONTENT_CONTAINER.className = layout;
  currentLayout = layout;
  getCurrentTiler().onActivate();
}

export function updateColumnCount(columnCount: number): void {
  for (const tiler of TILERS) {
    tiler.setColumnCount(columnCount);
  }
}

export function updateRowSize(rowSize: number): void {
  for (const tiler of TILERS) {
    tiler.setRowSize(rowSize);
  }
}

export function showSkeleton(): void {
  getCurrentTiler().showSkeleton();
}

export function addTilerEventListeners(): void {
  Events.document.wheel.on(changeItemSizeOnShiftScroll);
  Events.favorites.columnCountChanged.on(updateColumnCount);
  Events.favorites.rowSizeChanged.on(updateRowSize);
  Events.favorites.layoutChanged.on(hideUnusedLayoutSizer);
  Events.searchPage.layoutChanged.on(hideUnusedLayoutSizer);
}

export function setupTiler(): void {
  CONTENT_CONTAINER.className = currentLayout;
  updateColumnCount(Preferences.columnCount.value);
  updateRowSize(Preferences.rowSize.value);
  addTilerEventListeners();
}
