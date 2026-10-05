import { removeDataset, setDataset } from "@/utils/browser/dataset";
import { AbstractTiler } from "@/lib/ui/tilers/abstract_tiler";
import { Layout } from "@/types/app";
import { ThumbConfig } from "@/config/thumb_config";
import { getItemsInContainer } from "@/lib/ui/thumb/query";
import { rescaleGeometric } from "@/core/utils/number/number";
import { waitForThumbsToLoadInContainer } from "@/lib/ui/thumb/loading";

export class RowTiler extends AbstractTiler {
  public layout: Layout = "row";
  private currentlyMarkingLastRow = false;

  public tile(items: HTMLElement[]): void {
    super.tile(items);
    this.markItemsOnLastRow();
  }

  public reTile(items: HTMLElement[]): boolean {
    if (!super.reTile(items)) {
      return false;
    }
    this.markItemsOnLastRow();
    return true;
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
  const widths = { min: Math.floor(window.innerWidth / 20), max: Math.floor(window.innerWidth / 2) };
  return rescaleGeometric(rowHeight, ThumbConfig.rowHeightBounds, widths);
}

function getItemsOnLastRow(items: HTMLElement[]): HTMLElement[] {
  items = [...items].reverse();
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
