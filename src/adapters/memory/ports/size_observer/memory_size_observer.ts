import { ObservedSize } from "@/core/utils/geometry/observed_size";
import { SizeObserver } from "@/core/boundary/ports/size_observer/size_observer";

export class MemorySizeObserver implements SizeObserver {
  private readonly subscriptions = new Map<Element, Set<(observedSize: ObservedSize) => void>>();

  public observe(element: Element, onResize: (observedSize: ObservedSize) => void): () => void {
    const subscriptions = this.subscriptions.get(element) ?? new Set();

    subscriptions.add(onResize);
    this.subscriptions.set(element, subscriptions);
    return () => subscriptions.delete(onResize);
  }

  public resize(element: Element, { width, height, devicePixelWidth = width }: Omit<ObservedSize, "devicePixelWidth"> & Partial<ObservedSize>): void {
    this.subscriptions.get(element)?.forEach(onResize => onResize({ width, height, devicePixelWidth }));
  }
}
