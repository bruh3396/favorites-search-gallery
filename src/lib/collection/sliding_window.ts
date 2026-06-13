export class SlidingWindow<T> {
  private items: T[] = [];
  private cursor = 0;

  constructor(private readonly sliceSize: number) {}

  public reset(items: T[]): void {
    this.items = items;
    this.cursor = 0;
  }

  public append(items: T[]): void {
    this.items.push(...items);
  }

  public hasMore(): boolean {
    return this.cursor < this.items.length;
  }

  public nextSlice(): T[] {
    const slice = this.items.slice(this.cursor, this.cursor + this.sliceSize);

    this.cursor += slice.length;
    return slice;
  }
}
