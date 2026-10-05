export interface KeyedListDependencies<T> {
  getKey: (item: T) => string;
  create: (item: T) => HTMLElement;
}

export class KeyedList<T> {
  private elements = new Map<string, HTMLElement>();

  constructor(private readonly dependencies: KeyedListDependencies<T>) { }

  public reconcile(items: readonly T[]): HTMLElement[] {
    const { getKey, create } = this.dependencies;
    const elements = new Map<string, HTMLElement>();

    for (const item of items) {
      const key = getKey(item);

      elements.set(key, this.elements.get(key) ?? create(item));
    }
    this.elements = elements;
    return [...elements.values()];
  }

  public recreate(item: T): void {
    const { getKey, create } = this.dependencies;
    const key = getKey(item);
    const previous = this.elements.get(key);

    if (previous === undefined) {
      return;
    }
    const next = create(item);

    this.elements.set(key, next);
    previous.replaceWith(next);
  }
}
