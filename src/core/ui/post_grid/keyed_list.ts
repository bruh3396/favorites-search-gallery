import { Scoped, captureScope } from "@/core/utils/reactive/scope";
import { untracked } from "@/core/utils/reactive/signal";

export interface KeyedListDependencies<T> {
  getKey: (item: T) => string;
  create: (item: T) => HTMLElement;
}

export class KeyedList<T> {
  private elements = new Map<string, Scoped<HTMLElement>>();
  private readonly createItemScope = captureScope();

  constructor(private readonly dependencies: KeyedListDependencies<T>) { }

  public reconcile(items: readonly T[]): HTMLElement[] {
    const { getKey } = this.dependencies;
    const elements = new Map<string, Scoped<HTMLElement>>();

    for (const item of items) {
      const key = getKey(item);

      elements.set(key, this.elements.get(key) ?? this.create(item));
    }

    for (const [key, element] of this.elements) {
      if (!elements.has(key)) {
        element.dispose();
      }
    }
    this.elements = elements;
    return [...elements.values()].map(({ result }) => result);
  }

  public recreate(item: T): void {
    const key = this.dependencies.getKey(item);
    const previous = this.elements.get(key);

    if (previous === undefined) {
      return;
    }
    const next = this.create(item);

    this.elements.set(key, next);
    previous.result.replaceWith(next.result);
    previous.dispose();
  }

  private create(item: T): Scoped<HTMLElement> {
    return this.createItemScope(() => untracked(() => this.dependencies.create(item)));
  }
}
