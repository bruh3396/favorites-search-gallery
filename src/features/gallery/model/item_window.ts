import { itemsAround, wrappedItemsAround } from "@/utils/pure/array";
import { Identifiable } from "@/types/app";

export class GalleryItemWindow<T extends Identifiable> {
  private readonly getItems: () => T[];
  private readonly limit: number;
  private readonly window: (items: T[], index: number, limit: number) => T[];

  constructor(getItems: () => T[], wrapAround: boolean, limit: number = 50) {
    this.getItems = getItems;
    this.limit = limit;
    this.window = wrapAround ? wrappedItemsAround : itemsAround;
  }

  public getItemsAround(id: string): T[] {
    const items = this.getItems();
    const index = items.findIndex(item => item.id === id);
    return this.window(items, index, this.limit);
  }
}
