import { ObservedSize } from "@/core/utils/geometry/observed_size";
import { SizeObserver } from "@/core/boundary/ports/size_observer/size_observer";

export class BrowserSizeObserver implements SizeObserver {
  private readonly subscriptions = new Map<Element, { onResize:(size: ObservedSize) => void }>();

  private readonly observer = new ResizeObserver(entries => {
    for (const entry of entries) {
      const subscription = this.subscriptions.get(entry.target);

      if (subscription !== undefined) {
        const { width, height } = entry.contentRect;
        const devicePixelWidth = entry.devicePixelContentBoxSize?.[0]?.inlineSize ?? width * devicePixelRatio;

        subscription.onResize({ width, height, devicePixelWidth });
      }
    }
  });

  public observe(element: Element, onResize: (size: ObservedSize) => void): () => void {
    const subscription = { onResize };

    this.subscriptions.set(element, subscription);
    this.observer.observe(element);
    return (): void => {
      if (this.subscriptions.get(element) === subscription) {
        this.subscriptions.delete(element);
        this.observer.unobserve(element);
      }
    };
  }
}
