import { CONTENT_CONTAINER } from "../../../../../lib/global/content_container";
import { ColumnTiler } from "./favorites_column_tiler";
import { FavoriteLayout } from "../../../../../types/common_types";
import { GridTiler } from "./favorites_grid_tiler";
import { NativeTiler } from "./favorites_native_tiler";
import { Preferences } from "../../../../../lib/global/preferences/preferences";
import { RowTiler } from "./favorites_row_tiler";
import { SquareTiler } from "./favorites_square_tiler";
import { Tiler } from "./favorites_tiler_interface";
import { getAllThumbs } from "../../../../../utils/dom/dom";

const TILERS = [
  new ColumnTiler(),
  new GridTiler(),
  new RowTiler(),
  new SquareTiler(),
  new NativeTiler()
];
let currentLayout: FavoriteLayout = Preferences.favoritesLayout.value;

export function getCurrentTiler(): Tiler {
  return TILERS.find(tiler => tiler.className === currentLayout) ?? TILERS[0];
}

export function getCurrentLayout(): FavoriteLayout {
  return currentLayout;
}

export function tile(favorites: HTMLElement[]): void {
  getCurrentTiler().tile(favorites);
}

export function addItemsToBottom(favorites: HTMLElement[]): void {
  getCurrentTiler().addItemsToBottom(favorites);
}

export function addItemsToTop(favorites: HTMLElement[]): void {
  getCurrentTiler().addItemsToTop(favorites);
}

export function changeLayout(layout: FavoriteLayout): void {
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

export function setupFavoritesTiler(): void {
  CONTENT_CONTAINER.className = currentLayout;
  getCurrentTiler().setColumnCount(Preferences.columnCount.value);
  getCurrentTiler().setRowSize(Preferences.rowSize.value);
  // getCurrentTiler().onActivate();
  tile(getAllThumbs());
}
