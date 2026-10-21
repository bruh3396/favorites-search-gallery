import { ObservedSize, SizeObserver } from "@/core/boundary/ports/size_observer/size_observer";

export class MemorySizeObserver implements SizeObserver {
  private readonly subscriptions = new Map<Element, Set<(size: ObservedSize) => void>>();

  public observe(element: Element, onResize: (size: ObservedSize) => void): () => void {
    const subscriptions = this.subscriptions.get(element) ?? new Set();

    subscriptions.add(onResize);
    this.subscriptions.set(element, subscriptions);
    return () => subscriptions.delete(onResize);
  }

  public resize(element: Element, size: ObservedSize): void {
    this.subscriptions.get(element)?.forEach(onResize => onResize(size));
  }
}
