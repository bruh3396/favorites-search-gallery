import { COLUMN_CLASS_NAME, getThumbsInContainer, getThumbsInMatrix } from "../../dom/thumb";
import { AbstractTiler } from "./abstract_tiler";
import { LayoutMode } from "../../../types/ui";

export class ColumnTiler extends AbstractTiler {
  public layoutMode: LayoutMode = "column";
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
    if (this.enabled) {
      // this.deactivate();
      // this.activate();
    }
    this.tile(items.concat(getThumbsInContainer(this.container)));
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
    for (const column of this.columns) {
      this.container.appendChild(column);
    }
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
    const columnLengths = this.columns.map(column => column.children.length);
    const minColumnLength = Math.min(...columnLengths);
    const firstIndexWithMinimumLength = columnLengths.findIndex(length => length === minColumnLength);
    return firstIndexWithMinimumLength === -1 ? 0 : firstIndexWithMinimumLength;
  }
}
