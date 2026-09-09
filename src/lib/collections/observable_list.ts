import { Identifiable } from "@/types/app";
import { doNothing } from "@/utils/pure/function";
import { shuffleInPlace as shuffleArray } from "@/utils/pure/array";

export class ObservableList<T extends Identifiable> {
  private items: T[] = [];
  private onChanged: (items: T[]) => void = doNothing;

  public setup(onChanged: (items: T[]) => void): void {
    this.onChanged = onChanged;
  }

  public get(): T[] {
    return this.items;
  }

  public set(items: T[]): T[] {
    this.items = items;
    this.onChanged(this.items);
    return this.items;
  }

  public invert(allItems: T[]): T[] {
    const ids = new Set(this.items.map(item => item.id));
    return allItems.filter(item => !ids.has(item.id));
  }

  public shuffle(): T[] {
    return this.set(shuffleArray(this.items));
  }

  public append(items: T[]): T[] {
    this.set([...this.items, ...items]);
    return items;
  }

  public prepend(items: T[]): T[] {
    this.set([...items, ...this.items]);
    return items;
  }
}
