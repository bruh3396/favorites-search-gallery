/* eslint-disable max-classes-per-file */
import { FavoritesConfig } from "@/config/favorites_config";

abstract class EdgeObserver {
  protected readonly getSentinels: () => HTMLElement[];
  private intersectionObserver: IntersectionObserver;
  private readonly onEdgeReached: () => void;

  constructor(onEdgeReached: () => void, getSentinels: () => HTMLElement[]) {
    this.onEdgeReached = onEdgeReached;
    this.getSentinels = getSentinels;
    this.intersectionObserver = this.createIntersectionObserver();
  }

  protected abstract get rootMargin(): string;
  protected abstract get label(): string;

  public disconnect(): void {
    this.intersectionObserver.disconnect();
  }

  public refresh(): void {
    this.disconnect();

    for (const sentinel of this.getSentinels()) {
      this.intersectionObserver.observe(sentinel);
    }
  }

  private createIntersectionObserver(): IntersectionObserver {
    return new IntersectionObserver(this.onIntersectionChanged.bind(this), {
      threshold: [0.1],
      rootMargin: this.rootMargin
    });
  }

  private onIntersectionChanged(entries: IntersectionObserverEntry[]): void {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        this.onEdgeReached();
        this.disconnect();
        return;
      }
    }
  }
}

export class PageBottomObserver extends EdgeObserver {
  protected get rootMargin(): string {
    return `0% 0% ${FavoritesConfig.infiniteScrollMargin} 0%`;
  }

  protected get label(): string {
    return "bottom";
  }
}

export class PageTopObserver extends EdgeObserver {
  protected get rootMargin(): string {
    return `${FavoritesConfig.infiniteScrollMargin} 0% 0% 0%`;
  }

  protected get label(): string {
    return "top";
  }
}
