import { VisibilityObserver } from "@/core/boundary/ports/visibility_observer/visibility_observer";

export class BrowserVisibilityObserver implements VisibilityObserver {
  private readonly subscriptions = new Map<Element, { onVisibilityChange:(visible: boolean) => void }>();

  private readonly observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const subscription = this.subscriptions.get(entry.target);

      if (subscription !== undefined) {
        subscription.onVisibilityChange(entry.isIntersecting && entry.intersectionRatio > 0);
      }
    }
  });

  public observe(element: Element, onVisibilityChange: (visible: boolean) => void): () => void {
    const subscription = { onVisibilityChange };

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
