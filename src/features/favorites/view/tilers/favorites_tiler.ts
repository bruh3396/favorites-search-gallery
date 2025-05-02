import {ON_DESKTOP_DEVICE, ON_MOBILE_DEVICE} from "../../../../lib/functional/flags";
import {ColumnTiler} from "./favorites_column_tiler";
import {FAVORITES_CONTENT_CONTAINER} from "../../setup/page_builder/favorites_content_container";
import {FavoriteLayout} from "../../../../types/primitives/primitives";
import {FavoritesSettings} from "../../../../config/favorites_settings";
import {GridTiler} from "./favorites_grid_tiler";
import {Preferences} from "../../../../store/preferences/preferences";
import {RowTiler} from "./favorites_row_tiler";
import {SquareTiler} from "./favorites_square_tiler";
import {Tiler} from "./favorites_tiler_interface";
import {insertStyleHTML} from "../../../../utils/dom/style";

const TILERS = [GridTiler, RowTiler, SquareTiler, ColumnTiler];
let currentLayout: FavoriteLayout = Preferences.layout.value;

export function getCurrentTiler(): Tiler {
  return TILERS.find(tiler => tiler.className === currentLayout) || RowTiler;
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

  if (ON_MOBILE_DEVICE) {
    layout = "column";
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
