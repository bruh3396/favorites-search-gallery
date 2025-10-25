import { ITEM_SELECTOR, changeGetAllThumbsImplementation, getAllThumbs, resetGetAllThumbsImplementation } from "../../../../utils/dom/dom";
import { BaseTiler } from "./base_tiler";
import { Layout } from "../../../../types/common_types";
import { ON_SEARCH_PAGE } from "../../flags/intrinsic_flags";
import { Preferences } from "../../preferences/preferences";

export class ColumnTiler extends BaseTiler {
  public className: Layout = "column";
  public skeletonStyle: Record<string, string> = {
    "width": "100%"
  };
  private columns: HTMLElement[];
  private columnCount: number;

  constructor() {
    super();
    this.columns = [];
    this.columnCount = ON_SEARCH_PAGE ? Preferences.searchPageColumnCount.value : Preferences.columnCount.value;
  }

  private get active(): boolean {
    return this.container.classList.contains(this.className);
  }

  private get inactive(): boolean {
    return !this.active;
  }

  public tile(items: HTMLElement[]): void {
    this.clearContainer();
    this.deleteColumns();
    this.createColumns();
    this.addItemsToColumns(items);
    this.addColumnsToContainer();
    this.updateGetAllThumbsImplementation();
  }

  public addItemsToTop(items: HTMLElement[]): void {
    if (this.active) {
      this.onDeactivate();
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

  public onActivate(): void {
    this.tile(getAllThumbs());
  }

  public onDeactivate(): void {
    const items = this.getAllItems();

    this.container.innerHTML = "";
    super.tile(items);
    resetGetAllThumbsImplementation();
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
