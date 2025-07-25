import { getAllThumbs, waitForAllThumbnailsToLoad } from "../../../../../utils/dom/dom";
import { FavoriteLayout } from "../../../../../types/primitives/primitives";
import { FavoritesBaseTiler } from "./favorites_base_tiler";
import { FavoritesSettings } from "../../../../../config/favorites_settings";
import { insertStyleHTML } from "../../../../../utils/dom/style";
import { mapRange } from "../../../../../utils/primitive/number";

class RowTiler extends FavoritesBaseTiler {
  public className: FavoriteLayout = "row";
  public skeletonStyle: Record<string, string> = { };

  public tile(items: HTMLElement[]): void {
    super.tile(items);
    this.markItemsOnLastRow();
  }

  public addItemsToBottom(items: HTMLElement[]): void {
    super.addItemsToBottom(items);
    this.markItemsOnLastRow();
  }

  public setColumnCount(): void {
  }

  public setRowSize(rowSize: number): void {
    const minWidth = Math.floor(window.innerWidth / 20);
    const maxWidth = Math.floor(window.innerWidth / 4);
    const pixelSize = Math.round(mapRange(rowSize, FavoritesSettings.rowSizeBounds.min, FavoritesSettings.rowSizeBounds.max, minWidth, maxWidth));

    insertStyleHTML(`
      #favorites-search-gallery-content.row {
        .favorite {
          height: ${pixelSize}px;
        }
      }
    `, "row-size");
  }

  public onActivate(): void {
    this.markItemsOnLastRow();
  }

  public onDeactivate(): void {
  }

  public async markItemsOnLastRow(): Promise<void> {
    await waitForAllThumbnailsToLoad();
    const items = getAllThumbs();

    if (items.length === 0) {
      return;
    }
    this.unMarkAllItemsAsLastRow(items);
    this.markItemsAsLastRow(this.getItemsOnLastRow(items));
  }

  public unMarkAllItemsAsLastRow(items: HTMLElement[]): void {
    for (const item of items) {
      item.classList.remove("last-row");
    }
  }

  public markItemsAsLastRow(items: HTMLElement[]): void {
    for (const item of items) {
      item.classList.add("last-row");
    }
  }

  private getItemsOnLastRow(items: HTMLElement[]): HTMLElement[] {
    items = items.slice().reverse();
    const itemsOnLastRow = [];
    const lastRowY = items[0].offsetTop;

    for (const item of items) {
      if (item.offsetTop !== lastRowY) {
        break;
      }
      itemsOnLastRow.push(item);
    }
    return itemsOnLastRow;
  }
}

export const FavoritesRowTiler = new RowTiler();
