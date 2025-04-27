import {getAllThumbs, waitForAllThumbnailsToLoad} from "../../../../utils/dom/dom";
import {getRandomPositiveIntegerInRange, mapRange} from "../../../../utils/primitive/number";
import {FavoriteLayout} from "../../../../types/primitives/primitives";
import {FavoritesBaseTiler} from "./base_tiler";
import {FavoritesSettings} from "../../../../config/favorites_settings";
import {Preferences} from "../../../../store/preferences/preferences";
import {insertStyleHTML} from "../../../../utils/dom/style";

class FavoritesRowTiler extends FavoritesBaseTiler {
  public className: FavoriteLayout = "row";

  protected createSkeletonItem(): HTMLElement {
    const skeletonItem = super.createSkeletonItem();

    skeletonItem.style.height = `${Preferences.rowSize.value * 50}px`;
    skeletonItem.style.width = `${getRandomPositiveIntegerInRange(200, 600)}px`;
    return skeletonItem;
  }

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

  public onActivation(): void {
    this.markItemsOnLastRow();
  }

  public onDeactivation(): void {
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

export const RowTiler = new FavoritesRowTiler();
