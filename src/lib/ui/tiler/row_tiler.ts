import { getItemsInContainer, waitForThumbnailsToLoadInContainer } from "../../dom/thumb";
import { AbstractTiler } from "./abstract_tiler";
import { GeneralSettings } from "../../../config/general_settings";
import { LayoutMode } from "../../../types/common_types";
import { insertStyle } from "../../../utils/dom/injector";
import { mapRange } from "../../../utils/number";

export class RowTiler extends AbstractTiler {
  public layoutMode: LayoutMode = "row";
  private currentlyMarkingLastRow = false;

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
    const pixelSize = Math.round(mapRange(rowSize, GeneralSettings.rowSizeBounds.min, GeneralSettings.rowSizeBounds.max, minWidth, maxWidth));

    insertStyle(`
      #${this.container.id}.row {
        .favorite {
          height: ${pixelSize}px;
        }
      }
    `, `${this.container.id}-row-size`);
    this.markItemsOnLastRow();
  }

  public onActivate(): void {
    this.markItemsOnLastRow();
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

  private async markItemsOnLastRow(): Promise<void> {
    if (this.currentlyMarkingLastRow || this.disabled) {
      return;
    }
    this.currentlyMarkingLastRow = true;
    await waitForThumbnailsToLoadInContainer(this.container);
    const items = getItemsInContainer(this.container);

    if (items.length === 0) {
      return;
    }
    this.unMarkAllItemsAsLastRow(items);
    this.markItemsAsLastRow(this.getItemsOnLastRow(items));
    this.currentlyMarkingLastRow = false;
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
