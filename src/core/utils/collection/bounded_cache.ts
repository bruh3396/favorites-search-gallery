export class BoundedCache<K, V> {
  private readonly entries = new Map<K, V>();

  constructor(private readonly capacity: number) { }

  public get size(): number {
    return this.entries.size;
  }

  public has(key: K): boolean {
    return this.entries.has(key);
  }

  public get(key: K): V | undefined {
    if (!this.entries.has(key)) {
      return undefined;
    }
    const value = this.entries.get(key) as V;

    this.entries.delete(key);
    this.entries.set(key, value);
    return value;
  }

  public set(key: K, value: V): void {
    this.entries.delete(key);
    this.entries.set(key, value);

    if (this.entries.size > this.capacity) {
      this.entries.delete(this.entries.keys().next().value as K);
    }
  }

  public clear(): void {
    this.entries.clear();
  }

}
