import { ON_FAVORITES_PAGE, ON_SEARCH_PAGE } from "../environment/environment";
import { changeItemSizeOnShiftScroll, hideUnusedLayoutSizer } from "./layout_event_handlers";
import { AbstractTiler } from "./tilers/abstract_tiler";
import { CONTENT } from "../shell";
import { ColumnTiler } from "./tilers/column_tiler";
import { Events } from "../communication/events";
import { GridTiler } from "./tilers/grid_tiler";
import { LayoutMode } from "../../types/common_types";
import { NativeTiler } from "./tilers/native_tiler";
import { Preferences } from "../preferences";
import { RowTiler } from "./tilers/row_tiler";
import { SquareTiler } from "./tilers/square_tiler";

const COLUMN_TILER = new ColumnTiler();
const TILERS: AbstractTiler[] = [COLUMN_TILER, new GridTiler(), new RowTiler(), new SquareTiler(), new NativeTiler()];
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
  currentTiler.deselect();
  currentLayout = layout;
  currentTiler = TILER_MAP.get(layout) ?? COLUMN_TILER;
  CONTENT.className = layout;
  currentTiler.select();
}

function addEventListeners(): void {
  Events.document.wheel.on(changeItemSizeOnShiftScroll);
  Events.favorites.columnCountChanged.on(setColumnCount);
  Events.favorites.rowSizeChanged.on(setRowSize);
  Events.favorites.layoutChanged.on(hideUnusedLayoutSizer);
  Events.searchPage.layoutChanged.on(hideUnusedLayoutSizer);
}

export function setupLayout(): void {
  CONTENT.className = currentLayout;
  setColumnCount(ON_SEARCH_PAGE ? Preferences.searchPageColumnCount.value : Preferences.columnCount.value);
  setRowSize(ON_SEARCH_PAGE ? Preferences.searchPageRowSize.value : Preferences.rowSize.value);
  addEventListeners();
}
