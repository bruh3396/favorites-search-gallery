import { getItemsInContainer, waitForThumbsToLoadInContainer } from "@/lib/thumb/thumbs";
import { removeDataset, setDataset } from "@/utils/browser/dataset";
import { AbstractTiler } from "@/lib/ui/tilers/abstract_tiler";
import { Layout } from "@/types/app";
import { ThumbConfig } from "@/config/thumb_config";
import { rescale } from "@/utils/pure/number";

export class RowTiler extends AbstractTiler {
  public layout: Layout = "row";
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

  public setRowHeight(rowHeight: number): void {
    this.container.style.setProperty("--tile-row-height", `${rowHeightToPixels(rowHeight)}px`);
    this.markItemsOnLastRow();
  }

  public onActivate(): void {
    this.markItemsOnLastRow();
  }

  private async markItemsOnLastRow(): Promise<void> {
    if (this.currentlyMarkingLastRow || this.disabled) {
      return;
    }
    this.currentlyMarkingLastRow = true;
    await waitForThumbsToLoadInContainer(this.container);
    this.currentlyMarkingLastRow = false;
    const items = getItemsInContainer(this.container);

    if (items.length === 0) {
      return;
    }
    items.forEach(item => removeDataset(item, "lastRow"));
    getItemsOnLastRow(items).forEach(item => setDataset(item, "lastRow"));
  }
}

function rowHeightToPixels(rowHeight: number): number {
  const minWidth = Math.floor(window.innerWidth / 20);
  const maxWidth = Math.floor(window.innerWidth / 4);
  return Math.round(rescale(rowHeight, ThumbConfig.rowHeightBounds.min, ThumbConfig.rowHeightBounds.max, minWidth, maxWidth));
}

function getItemsOnLastRow(items: HTMLElement[]): HTMLElement[] {
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
