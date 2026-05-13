import { COLUMN_CLASS_NAME, getThumbsInContainer, getThumbsInMatrix } from "../../dom/thumb";
import { AbstractTiler } from "./abstract_tiler";
import { Layout } from "../../../types/ui";

export class ColumnTiler extends AbstractTiler {
  public layout: Layout = "tiler--column";
  private columns: HTMLElement[];
  private columnCount: number;

  constructor(container: HTMLElement, columnCount: number) {
    super(container);
    this.columns = [];
    this.columnCount = columnCount;
  }

  public tile(items: HTMLElement[]): void {
    this.clearContainer();
    this.deleteColumns();
    this.createColumns();
    this.addItemsToColumns(items);
    this.addColumnsToContainer();
  }

  public addItemsToTop(items: HTMLElement[]): void {
    this.tile(items.concat(getThumbsInMatrix(this.container)));
  }

  public addItemsToBottom(items: HTMLElement[]): void {
    if (this.disabled) {
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

    if (this.disabled) {
      this.columnCount = columnCount;
      return;
    }
    const items = this.getAllItems();

    this.columnCount = columnCount;
    this.tile(items);
  }

  protected onActivate(): void {
    this.tile(getThumbsInContainer(this.container));
  }

  protected onDeactivate(): void {
    const items = this.getAllItems();

    this.container.innerHTML = "";
    super.tile(items);
  }

  private createColumns(): void {
    for (let i = 0; i < this.columnCount; i += 1) {
      const column = document.createElement("div");

      column.classList.add(COLUMN_CLASS_NAME);
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
    const fragment = document.createDocumentFragment();

    for (const column of this.columns) {
      fragment.appendChild(column);
    }
    this.container.appendChild(fragment);
  }

  private getAllItems(): HTMLElement[] {
    return getThumbsInMatrix(this.container);
  }

  private addNewItemsToColumns(items: HTMLElement[]): void {
    const columnIndexOffset = this.getIndexOfNextAvailableColumn();

    for (let i = 0; i < items.length; i += 1) {
      this.addItemToColumn(i + columnIndexOffset, items[i]);
    }
  }

  private getIndexOfNextAvailableColumn(): number {
    let minLength = Infinity;
    let minIndex = 0;

    for (let i = 0; i < this.columns.length; i += 1) {
      const len = this.columns[i].children.length;

      if (len < minLength) {
        minLength = len;
        minIndex = i;
      }
    }
    return minIndex;
  }
}
