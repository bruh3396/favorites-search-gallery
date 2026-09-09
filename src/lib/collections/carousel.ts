import { Boundary } from "@/types/boundary";
import { Identifiable } from "@/types/app";
import { clamp } from "@/utils/pure/number";

export class Carousel<T extends Identifiable> {
  private currentIndex: number = 0;
  private items: T[] = [];
  private readonly index: Map<string, number> = new Map();

  public jumpToLast(): void {
    this.requireItems();
    this.setCurrentIndex(this.items.length - 1);
  }

  public jumpToFirst(): void {
    this.requireItems();
    this.setCurrentIndex(0);
  }

  public move(delta: number): Boundary {
    this.requireItems();
    const nextIndex = this.currentIndex + delta;

    this.setCurrentIndex(nextIndex);
    return nextIndex < 0 ? "start" : nextIndex >= this.items.length ? "end" : "none";
  }

  public currentItem(): T {
    this.requireItems();
    const item = this.items[this.currentIndex];

    if (item === undefined) {
      throw new Error(`Could not get item at index: ${this.currentIndex}`);
    }
    return item;
  }

  public pointTo(item: Identifiable): void {
    this.requireItems();
    const index = this.index.get(item.id);

    if (index === undefined) {
      throw new Error(`Could not find item with id: ${item.id}`);
    }
    this.setCurrentIndex(index);
  }

  public indexItems(source: T[]): void {
    this.index.clear();
    this.items = source;

    for (let i = 0; i < this.items.length; i += 1) {
      const item = this.items[i];

      if (item.id === "") {
        continue;
      }

      if (this.index.has(item.id)) {
        throw new Error(`Duplicate item id: ${item.id}`);
      }
      this.index.set(item.id, i);
    }

    if (this.items.length === 0 || this.currentIndex >= this.items.length) {
      this.currentIndex = 0;
    }
  }

  private requireItems(): void {
    if (this.items.length === 0) {
      throw new Error("Tried to navigate without items");
    }
  }

  private setCurrentIndex(index: number): void {
    this.currentIndex = clamp(index, 0, this.items.length - 1);
  }
}
