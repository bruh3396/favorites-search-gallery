import { itemsAroundIndex, wrappedItemsAroundIndex } from "@/utils/collection/array";
import { Identifiable } from "@/types/app";

export class ItemWindow<T extends Identifiable> {
  private readonly getItems: () => T[];
  private readonly limit: number;
  private readonly window: (items: T[], index: number, limit: number) => T[];

  constructor(getItems: () => T[], wrapAround: boolean, limit: number = 50) {
    this.getItems = getItems;
    this.limit = limit;
    this.window = wrapAround ? wrappedItemsAroundIndex : itemsAroundIndex;
  }

  public getItemsAround(id: string): T[] {
    const items = this.getItems();
    const index = items.findIndex(item => item.id === id);
    return this.window(items, index, this.limit);
  }
}
