import { ON_FAVORITES_PAGE, ON_SEARCH_PAGE } from "../environment/environment";
import { changeItemSizeOnShiftScroll, hideUnusedLayoutSizer } from "./layout_event_handlers";
import { AbstractTiler } from "../ui/tiler/abstract_tiler";
import { CONTENT } from "../shell";
import { ColumnTiler } from "../ui/tiler/column_tiler";
import { Events } from "../communication/events/events";
import { GridTiler } from "../ui/tiler/grid_tiler";
import { LayoutMode } from "../../types/common_types";
import { NativeTiler } from "../ui/tiler/native_tiler";
import { Preferences } from "../preferences/preferences";
import { RowTiler } from "../ui/tiler/row_tiler";
import { SquareTiler } from "../ui/tiler/square_tiler";

const COLUMN_TILER = new ColumnTiler(CONTENT, ON_FAVORITES_PAGE ? Preferences.columnCount.value : Preferences.searchPageColumnCount.value);
const TILERS: AbstractTiler[] = [COLUMN_TILER, new GridTiler(CONTENT), new RowTiler(CONTENT), new SquareTiler(CONTENT), new NativeTiler(CONTENT)];
const TILER_MAP = new Map(TILERS.map(t => [t.layoutMode, t]));
let currentLayout: LayoutMode = ON_FAVORITES_PAGE ? Preferences.favoritesLayout.value : Preferences.searchPageLayout.value;
let currentTiler: AbstractTiler = TILER_MAP.get(currentLayout) ?? COLUMN_TILER;

function setColumnCount(columnCount: number): void {
  TILERS.forEach(tiler => tiler.setColumnCount(columnCount));
}

function setRowSize(rowSize: number): void {
  TILERS.forEach(tiler => tiler.setRowSize(rowSize));
}

export function getLayout(): LayoutMode {
  return currentLayout;
}

export function tile(items: HTMLElement[]): void {
  currentTiler.tile(items);
}

export function addToBottom(items: HTMLElement[]): void {
  currentTiler.addItemsToBottom(items);
}

export function addToTop(items: HTMLElement[]): void {
  currentTiler.addItemsToTop(items);
}

export function changeLayout(layout: LayoutMode): void {
  if (currentLayout === layout) {
    return;
  }
  currentTiler.deactivate();
  currentLayout = layout;
  currentTiler = TILER_MAP.get(layout) ?? COLUMN_TILER;
  currentTiler.activate();
}

function addEventListeners(): void {
  Events.document.wheel.on(changeItemSizeOnShiftScroll);
  Events.favorites.columnCountChanged.on(setColumnCount);
  Events.favorites.rowSizeChanged.on(setRowSize);
  Events.favorites.layoutChanged.on(hideUnusedLayoutSizer);
  Events.searchPage.layoutChanged.on(hideUnusedLayoutSizer);
}

export function setupLayout(): void {
  currentTiler.activate();
  setColumnCount(ON_SEARCH_PAGE ? Preferences.searchPageColumnCount.value : Preferences.columnCount.value);
  setRowSize(ON_SEARCH_PAGE ? Preferences.searchPageRowSize.value : Preferences.rowSize.value);
  addEventListeners();
}
