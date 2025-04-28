import {ITEM_SELECTOR, changeGetAllTHumbsImplementation as changeGetAllThumbsImplementation, getAllThumbs, resetGetAllThumbsImplementation} from "../../../../utils/dom/dom";
import {FavoriteLayout} from "../../../../types/primitives/primitives";
import {FavoritesBaseTiler} from "./base_tiler";
import {Preferences} from "../../../../store/preferences/preferences";

class FavoritesColumnTiler extends FavoritesBaseTiler {
  private columns: HTMLElement[];
  private columnCount: number;
  public className: FavoriteLayout = "column";

  constructor() {
    super();
    this.columns = [];
    this.columnCount = Preferences.columnCount.value;
  }

  protected createSkeletonItem(): HTMLElement {
    const skeletonItem = super.createSkeletonItem();

    skeletonItem.style.width = "100%";
    return skeletonItem;
  }

  get inactive(): boolean {
    return document.querySelector(".favorites-column") === null;
  }

  get active(): boolean {
    return !this.inactive;
  }

  public tile(items: HTMLElement[]): void {
    this.clearContainer();
    this.deleteColumns();
    this.createColumns();
    this.addItemsToColumns(items);
    this.addColumnsToContainer();
    this.updateGetAllThumbsImplementation();
  }

  private createColumns(): void {
    for (let i = 0; i < this.columnCount; i += 1) {
      const column = document.createElement("div");

      column.classList.add("favorites-column");
      this.columns.push(column);
    }
  }

  private deleteColumns(): void {
    for (const column of this.columns) {
      column.remove();
    }
    this.columns = [];
  }

  private addItemsToColumns(items: HTMLElement[]): void {
    for (let i = 0; i < items.length; i += 1) {
      this.addItemToColumn(i, items[i]);
    }
  }

  private addItemToColumn(itemIndex: number, item: HTMLElement): void {
    this.columns[itemIndex % this.columnCount].appendChild(item);
  }

  private clearContainer(): void {
    this.container.innerHTML = "";
  }

  private addColumnsToContainer(): void {
    for (const column of this.columns) {
      this.container.appendChild(column);
    }
  }
  public setColumnCount(columnCount: number): void {
    super.setColumnCount(columnCount);

    if (columnCount === this.columnCount) {
      return;
    }

    if (this.inactive) {
      this.columnCount = columnCount;
      return;
    }
    const items = this.getAllItems();

    this.columnCount = columnCount;
    this.tile(items);
  }

  public onActivation(): void {
    this.tile(getAllThumbs());
  }

  public onDeactivation(): void {
    const items = this.getAllItems();

    this.container.innerHTML = "";
    super.tile(items);
    resetGetAllThumbsImplementation();
  }

  private getAllItems(): HTMLElement[] {
    const itemCount = Array.from(document.querySelectorAll(ITEM_SELECTOR)).length;
    const result = [];
    const matrix = this.columns.map(column => Array.from(column.querySelectorAll(ITEM_SELECTOR)));

    for (let i = 0; i < itemCount; i += 1) {
      const column = i % this.columnCount;
      const row = Math.floor(i / this.columnCount);
      const item = matrix[column][row];

      if (item instanceof HTMLElement) {
        result.push(item);
      }
    }
    return result;
  }

  private updateGetAllThumbsImplementation(): void {
    changeGetAllThumbsImplementation(this.getAllItems.bind(this));
  }

  public addItemsToTop(items: HTMLElement[]): void {
    if (this.active) {
      this.onDeactivation();
    }
    this.tile(items.concat(getAllThumbs()));
  }

  public addItemsToBottom(items: HTMLElement[]): void {
    if (this.inactive) {
      this.tile(items);
      return;
    }
    this.addNewItemsToColumns(items);
  }

  private addNewItemsToColumns(items: HTMLElement[]): void {
    const columnIndexOffset = this.getIndexOfNextAvailableColumn();

    for (let i = 0; i < items.length; i += 1) {
      this.addItemToColumn(i + columnIndexOffset, items[i]);
    }
  }

  private getIndexOfNextAvailableColumn(): number {
    const columnLengths = this.columns.map(column => column.children.length);
    const minColumnLength = Math.min(...columnLengths);
    const firstIndexWithMinimumLength = columnLengths.findIndex(length => length === minColumnLength);
    return firstIndexWithMinimumLength === -1 ? 0 : firstIndexWithMinimumLength;
  }
}

export const ColumnTiler = new FavoritesColumnTiler();
