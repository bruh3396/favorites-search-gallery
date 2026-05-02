import { ON_FAVORITES_PAGE, ON_SEARCH_PAGE } from "../environment/environment";
import { changeItemSizeOnShiftScroll, hideUnusedLayoutSizer } from "./layout_event_handlers";
import { AbstractTiler } from "../ui/tilers/abstract_tiler";
import { ColumnTiler } from "../ui/tilers/column_tiler";
import { Content } from "../shell";
import { Events } from "../communication/events";
import { GridTiler } from "../ui/tilers/grid_tiler";
import { LayoutMode } from "../../types/ui";
import { NativeTiler } from "../ui/tilers/native_tiler";
import { Preferences } from "../preferences/preferences";
import { RowTiler } from "../ui/tilers/row_tiler";
import { SquareTiler } from "../ui/tilers/square_tiler";

const columnTiler = new ColumnTiler(Content, ON_FAVORITES_PAGE ? Preferences.columnCount.value : Preferences.searchPageColumnCount.value);
const tilers: AbstractTiler[] = [columnTiler, new GridTiler(Content), new RowTiler(Content), new SquareTiler(Content), new NativeTiler(Content)];
const tilerMap = new Map(tilers.map(tiler => [tiler.layoutMode, tiler]));
let currentLayout: LayoutMode = ON_FAVORITES_PAGE ? Preferences.favoritesLayout.value : Preferences.searchPageLayout.value;
let currentTiler: AbstractTiler = tilerMap.get(currentLayout) ?? columnTiler;

function addEventListeners(): void {
  Events.document.wheel.on(changeItemSizeOnShiftScroll);
  Events.favorites.columnCountChanged.on(setColumnCount);
  Events.favorites.rowSizeChanged.on(setRowSize);
  Events.favorites.layoutChanged.on(hideUnusedLayoutSizer);
  Events.searchPage.layoutChanged.on(hideUnusedLayoutSizer);
}

export function changeLayout(layout: LayoutMode): void {
  if (currentLayout === layout) {
    return;
  }
  currentTiler.deactivate();
  currentLayout = layout;
  currentTiler = tilerMap.get(layout) ?? columnTiler;
  currentTiler.activate();
}

export function setupLayout(): void {
  currentTiler.activate();
  setColumnCount(ON_SEARCH_PAGE ? Preferences.searchPageColumnCount.value : Preferences.columnCount.value);
  setRowSize(ON_SEARCH_PAGE ? Preferences.searchPageRowSize.value : Preferences.rowSize.value);
  addEventListeners();
}

export const setRowSize = (rowSize: number): void => tilers.forEach(tiler => tiler.setRowSize(rowSize));
export const setColumnCount = (columnCount: number): void => tilers.forEach(tiler => tiler.setColumnCount(columnCount));
export const getLayout = (): LayoutMode => currentLayout;
export const tile = (items: HTMLElement[]): void => currentTiler.tile(items);
export const addToBottom = (items: HTMLElement[]): void => currentTiler.addItemsToBottom(items);
export const addToTop = (items: HTMLElement[]): void => currentTiler.addItemsToTop(items);
