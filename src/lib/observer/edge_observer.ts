import { FavoritesConfig } from "@/config/favorites_config";

class EdgeObserver {
  private readonly onEdgeReached: () => Promise<boolean>;
  private readonly getSentinels: () => HTMLElement[];
  private readonly intersectionObserver: IntersectionObserver;
  private loading = false;

  constructor(rootMargin: string, onEdgeReached: () => Promise<boolean>, getSentinels: () => HTMLElement[]) {
    this.onEdgeReached = onEdgeReached;
    this.getSentinels = getSentinels;
    this.intersectionObserver = new IntersectionObserver(this.onIntersection.bind(this), {
      threshold: [0.1],
      rootMargin
    });
  }

  public disconnect(): void {
    this.intersectionObserver.disconnect();
    this.loading = false;
  }

  public refresh(): void {
    this.disconnect();

    for (const sentinel of this.getSentinels()) {
      this.intersectionObserver.observe(sentinel);
    }
  }

  private onIntersection(entries: IntersectionObserverEntry[]): void {
    if (this.loading || !entries.some((entry) => entry.isIntersecting)) {
      return;
    }
    this.loading = true;
    this.onEdgeReached().then((hasMore) => (hasMore ? this.refresh() : this.disconnect()));
  }
}

export class BottomEdgeObserver extends EdgeObserver {
  constructor(onEdgeReached: () => Promise<boolean>, getSentinels: () => HTMLElement[]) {
    super(`0% 0% ${FavoritesConfig.infiniteScrollMargin} 0%`, onEdgeReached, getSentinels);
  }
}

export class TopEdgeObserver extends EdgeObserver {
  constructor(onEdgeReached: () => Promise<boolean>, getSentinels: () => HTMLElement[]) {
    super(`${FavoritesConfig.infiniteScrollMargin} 0% 0% 0%`, onEdgeReached, getSentinels);
  }
}
