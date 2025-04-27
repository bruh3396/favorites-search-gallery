import {ON_DESKTOP_DEVICE, ON_MOBILE_DEVICE} from "../../../../lib/functional/flags";
import {ColumnTiler} from "./column_tiler";
import {FAVORITES_CONTENT_CONTAINER} from "../../page_builder/structure";
import {FavoriteLayout} from "../../../../types/primitives/primitives";
import {FavoritesSettings} from "../../../../config/favorites_settings";
import {GridTiler} from "./grid_tiler";
import {Preferences} from "../../../../store/preferences/preferences";
import {RowTiler} from "./row_tiler";
import {SquareTiler} from "./square_tiler";
import {Tiler} from "./interfaces";
import {insertStyleHTML} from "../../../../utils/dom/style";

const TILERS = [GridTiler, RowTiler, SquareTiler, ColumnTiler];
let currentLayout: FavoriteLayout = Preferences.layout.value;

function getCurrentTiler(): Tiler {
  return TILERS.find(tiler => tiler.className === currentLayout) || RowTiler;
}

function tile(favorites: HTMLElement[]): void {
  getCurrentTiler().tile(favorites);
}

function addItemsToBottom(favorites: HTMLElement[]): void {
  getCurrentTiler().addItemsToBottom(favorites);
}

function addItemsToTop(favorites: HTMLElement[]): void {
  getCurrentTiler().addItemsToTop(favorites);
}

function changeLayout(layout: FavoriteLayout): void {
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

function updateColumnCount(columnCount: number): void {
  for (const tiler of TILERS) {
    tiler.setColumnCount(columnCount);
  }
}

function updateRowSize(rowSize: number): void {
  for (const tiler of TILERS) {
    tiler.setRowSize(rowSize);
  }
}

function addStyles(): void {
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

function showSkeleton(): void {
  // FAVORITES_CONTENT_CONTAINER.insertAdjacentElement("beforebegin", SKELETON);
  getCurrentTiler().showSkeleton();
}

function setup(): void {
  showSkeleton();
  addStyles();
  FAVORITES_CONTENT_CONTAINER.className = currentLayout;
  getCurrentTiler().setColumnCount(Preferences.columnCount.value);
  getCurrentTiler().setRowSize(Preferences.rowSize.value);
  getCurrentTiler().onActivation();
}

export const FavoritesTiler = {
  tile,
  addItemsToBottom,
  addItemsToTop,
  changeLayout,
  updateColumnCount,
  updateRowSize,
  setup
};
