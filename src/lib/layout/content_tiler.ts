import { ON_FAVORITES_PAGE, ON_SEARCH_PAGE } from "../environment/environment";
import { changeItemSizeOnShiftScroll, hideUnusedLayoutSizer } from "./content_tiler_handlers";
import { AbstractTiler } from "../ui/tilers/abstract_tiler";
import { ColumnTiler } from "../ui/tilers/column_tiler";
import { Content } from "../shell";
import { DomEvents } from "../communication/dom_events";
import { Events } from "../communication/events";
import { GridTiler } from "../ui/tilers/grid_tiler";
import { Layout } from "../../types/ui";
import { NativeTiler } from "../ui/tilers/native_tiler";
import { Preferences } from "../preferences/preferences";
import { RowTiler } from "../ui/tilers/row_tiler";
import { SquareTiler } from "../ui/tilers/square_tiler";

const columnTiler = new ColumnTiler(Content, ON_FAVORITES_PAGE ? Preferences.columnCount.value : Preferences.searchPageColumnCount.value);
const tilers: AbstractTiler[] = [columnTiler, new GridTiler(Content), new RowTiler(Content), new SquareTiler(Content), new NativeTiler(Content)];
const tilerMap = new Map(tilers.map(tiler => [tiler.layout, tiler]));
let currentLayout: Layout = ON_FAVORITES_PAGE ? Preferences.favoritesLayout.value : Preferences.searchPageLayout.value;
let currentTiler: AbstractTiler = tilerMap.get(currentLayout) ?? columnTiler;

export function setup(): void {
  currentTiler.activate();
  setColumnCount(ON_SEARCH_PAGE ? Preferences.searchPageColumnCount.value : Preferences.columnCount.value);
  setRowSize(ON_SEARCH_PAGE ? Preferences.searchPageRowSize.value : Preferences.rowSize.value);
  addEventListeners();
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

function addEventListeners(): void {
  DomEvents.document.wheel.on(e => changeItemSizeOnShiftScroll(e, currentLayout));
  Events.favorites.columnCountChanged.on(setColumnCount);
  Events.favorites.rowSizeChanged.on(setRowSize);
  Events.favorites.layoutChanged.on(hideUnusedLayoutSizer);
  Events.searchPage.layoutChanged.on(hideUnusedLayoutSizer);
}
