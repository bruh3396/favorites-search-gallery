export class KeyCodec<T> {
  private readonly idByKey: Map<string, number> = new Map<string, number>();
  private readonly items: (T | undefined)[] = [];

  constructor(private readonly toKey: (item: T) => string) {}

  public keyOf(item: T): string {
    return this.toKey(item);
  }

  public hasKey(key: string): boolean {
    return this.idByKey.has(key);
  }

  public encode(item: T): number {
    const key = this.toKey(item);
    const existing = this.idByKey.get(key);

    if (existing !== undefined) {
      return existing;
    }
    const id = this.items.length;

    this.items.push(item);
    this.idByKey.set(key, id);
    return id;
  }

  public forget(key: string): number | undefined {
    const id = this.idByKey.get(key);

    if (id === undefined) {
      return undefined;
    }
    this.idByKey.delete(key);
    this.items[id] = undefined;
    return id;
  }

  public decodeOne(id: number): T | undefined {
    return this.items[id];
  }

  public decode(ids: number[]): T[] {
    const result: T[] = [];

    for (const id of ids) {
      const item = this.items[id];

      if (item !== undefined) {
        result.push(item);
      }
    }
    return result;
  }
}
