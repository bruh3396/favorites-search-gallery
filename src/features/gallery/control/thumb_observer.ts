import { AppContext } from "@/app/context/context";
import { GalleryConfig } from "@/config/gallery_config";
import { debounceTrailing } from "@/lib/async/rate_limiting";
import { rectDistance } from "@/utils/pure/geometry";

class VisibleThumbObserver {
  private readonly observer: IntersectionObserver;
  private readonly visibleThumbs: Map<string, IntersectionObserverEntry> = new Map();
  private centerThumb: HTMLElement | null = null;
  private suppressNextBroadcast: boolean = false;
  private readonly scheduleBroadcast: () => void;

  constructor(onVisibleThumbsChanged: () => void) {
    this.scheduleBroadcast = debounceTrailing(onVisibleThumbsChanged, GalleryConfig.contentRefreshTime);
    this.observer = new IntersectionObserver(entries => this.onIntersection(entries), {
      root: null,
      rootMargin: `0px 0px ${GalleryConfig.bottomOverscanPercent}% 0px`,
      threshold: 0
    });
  }

  public refresh(thumbs: HTMLElement[]): void {
    this.setCenterThumb(null);
    this.observer.disconnect();
    this.visibleThumbs.clear();
    this.suppressNextBroadcast = true;
    thumbs.forEach(thumb => this.observer.observe(thumb));
  }

  public setCenterThumb(thumb: HTMLElement | null): void {
    this.centerThumb = thumb;
  }

  public getVisible(): HTMLElement[] {
    const entries = Array.from(this.visibleThumbs.values());
    return this.sortByDistanceFromCenter(entries)
      .map(entry => entry.target)
      .filter((target): target is HTMLElement => target instanceof HTMLElement);
  }

  private onIntersection(entries: IntersectionObserverEntry[]): void {
    this.updateVisible(entries);

    if (this.suppressNextBroadcast) {
      this.suppressNextBroadcast = false;
      return;
    }
    this.scheduleBroadcast();
  }

  private updateVisible(entries: IntersectionObserverEntry[]): void {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        this.visibleThumbs.set(entry.target.id, entry);
      } else {
        this.visibleThumbs.delete(entry.target.id);
      }
    }
  }

  private sortByDistanceFromCenter(entries: IntersectionObserverEntry[]): IntersectionObserverEntry[] {
    const center = this.centerThumb === null ? undefined : this.visibleThumbs.get(this.centerThumb.id);

    if (center === undefined) {
      return entries;
    }
    const centerRect = center.boundingClientRect;
    return entries.sort((a, b) => {
      const distanceA = rectDistance(centerRect, a.boundingClientRect);
      const distanceB = rectDistance(centerRect, b.boundingClientRect);
      return distanceA - distanceB;
    });
  }
}

export class GalleryThumbObserver {
  private observer: VisibleThumbObserver | null = null;

  constructor(private readonly context: AppContext) {}

  public setup(onVisibleThumbsChanged: () => void): void {
    const { onMobileDevice, onPostListPage } = this.context.environment;

    if (onMobileDevice || (onPostListPage && !GalleryConfig.upscaleEverythingOnPostList)) {
      return;
    }
    this.observer = new VisibleThumbObserver(onVisibleThumbsChanged);
  }

  public refresh(): void {
    this.observer?.refresh(this.context.shell.getContentThumbs());
  }

  public setCenterThumb(thumb: HTMLElement | null): void {
    this.observer?.setCenterThumb(thumb);
  }

  public getVisibleThumbs(): HTMLElement[] {
    return this.observer?.getVisible() ?? [];
  }
}
