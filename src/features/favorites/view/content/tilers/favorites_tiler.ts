import { FAVORITES_CONTENT_CONTAINER } from "../../../ui/structure/favorites_content_container";
import { FavoriteLayout } from "../../../../../types/primitives/primitives";
import { FavoritesColumnTiler } from "./favorites_column_tiler";
import { FavoritesGridTiler } from "./favorites_grid_tiler";
import { FavoritesRowTiler } from "./favorites_row_tiler";
import { FavoritesSettings } from "../../../../../config/favorites_settings";
import { FavoritesSquareTiler } from "./favorites_square_tiler";
import { ON_DESKTOP_DEVICE } from "../../../../../lib/globals/flags";
import { Preferences } from "../../../../../store/local_storage/preferences";
import { Tiler } from "./favorites_tiler_interface";
import { insertStyleHTML } from "../../../../../utils/dom/style";

const TILERS = [FavoritesGridTiler, FavoritesRowTiler, FavoritesSquareTiler, FavoritesColumnTiler];
let currentLayout: FavoriteLayout = Preferences.favoritesLayout.value;

export function getCurrentTiler(): Tiler {
  return TILERS.find(tiler => tiler.className === currentLayout) || FavoritesRowTiler;
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
  getCurrentTiler().onDeactivation();
  FAVORITES_CONTENT_CONTAINER.className = layout;
  currentLayout = layout;
  getCurrentTiler().onActivation();
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

export function addStyles(): void {
  const style = `
    #favorites-search-gallery-content {
      &.row, &.column, &.column .favorites-column, &.square, &.grid {
        gap: ${FavoritesSettings.thumbnailSpacing}px;
      }

      &.column {
        margin-right: ${ON_DESKTOP_DEVICE ? FavoritesSettings.rightContentMargin : 0}px;
      }
    }`;

  insertStyleHTML(style, "tiler-style");
}

export function showSkeleton(): void {
  getCurrentTiler().showSkeleton();
}

export function setupFavoritesTiler(): void {
  showSkeleton();
  addStyles();
  FAVORITES_CONTENT_CONTAINER.className = currentLayout;
  getCurrentTiler().setColumnCount(Preferences.columnCount.value);
  getCurrentTiler().setRowSize(Preferences.rowSize.value);
  getCurrentTiler().onActivation();
}
