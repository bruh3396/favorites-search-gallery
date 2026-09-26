import { FavoritesConfig } from "@/config/favorites_config";

export class PostListNavigatorPageBottomObserver {
  private intersectionObserver: IntersectionObserver;
  private onBottomReached: () => void;
  private readonly bottomElements: () => HTMLElement[];

  constructor(onBottomReached: () => void, bottomElements: () => HTMLElement[]) {
    this.onBottomReached = onBottomReached;
    this.bottomElements = bottomElements;
    this.intersectionObserver = this.createIntersectionObserver();
  }

  public disconnect(): void {
    this.intersectionObserver.disconnect();
  }

  public refresh(): void {
    this.disconnect();
    this.observeBottomElements();
  }

  private createIntersectionObserver(): IntersectionObserver {
    return new IntersectionObserver(this.onIntersectionChanged.bind(this), {
      threshold: [0.1],
      rootMargin: `0% 0% ${FavoritesConfig.infiniteScrollMargin} 0%`
    });
  }

  private observeBottomElements(): void {
    for (const element of this.bottomElements()) {
      this.intersectionObserver.observe(element);
    }
  }

  private onIntersectionChanged(entries: IntersectionObserverEntry[]): void {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        this.onBottomReached();
        this.disconnect();
        return;
      }
    }
  }
}
