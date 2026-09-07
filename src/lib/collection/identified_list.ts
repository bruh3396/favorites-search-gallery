import { Identifiable } from "@/types/app";

export class IdentifiedList<T extends Identifiable> {
  private items: T[] = [];
  private readonly itemsById = new Map<string, T>();

  public setAll(items: T[]): void {
    this.items = items;
    this.index(items);
  }

  public append(items: T[]): void {
    this.index(items);
    this.items.push(...items);
  }

  public prepend(items: T[]): void {
    this.index(items);
    this.items.unshift(...items);
  }

  public getAll(): T[] {
    return [...this.items];
  }

  public get(id: string): T | undefined {
    return this.itemsById.get(id);
  }

  public getAllIds(): Set<string> {
    return new Set(this.items.map(item => item.id));
  }

  private index(items: T[]): void {
    items.forEach(item => this.itemsById.set(item.id, item));
  }
}
