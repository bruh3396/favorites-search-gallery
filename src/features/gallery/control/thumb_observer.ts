import { ON_MOBILE_DEVICE, ON_POST_LIST_PAGE } from "@/lib/environment";
import { GalleryConfig } from "@/config/gallery_config";
import { debounceTrailing } from "@/lib/async/debounce";
import { getAllContentThumbs } from "@/app/layout/content_thumbs";
import { getRectDistance } from "@/utils/geometry";

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

  public refresh(): void {
    this.setCenterThumb(null);
    this.observer.disconnect();
    this.visibleThumbs.clear();
    this.suppressNextBroadcast = true;
    getAllContentThumbs().forEach(thumb => this.observer.observe(thumb));
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
      const distanceA = getRectDistance(centerRect, a.boundingClientRect);
      const distanceB = getRectDistance(centerRect, b.boundingClientRect);
      return distanceA - distanceB;
    });
  }
}

let instance: VisibleThumbObserver | null = null;

export function setup(onVisibleThumbsChanged: () => void): void {
  if (ON_MOBILE_DEVICE || (ON_POST_LIST_PAGE && !GalleryConfig.upscaleEverythingOnPostList)) {
    return;
  }
  instance = new VisibleThumbObserver(onVisibleThumbsChanged);
}

export function refresh(): void {
  instance?.refresh();
}

export function setCenterThumb(thumb: HTMLElement | null): void {
  instance?.setCenterThumb(thumb);
}

export function getVisibleThumbs(): HTMLElement[] {
  return instance?.getVisible() ?? [];
}

export function getVisibleThumbIds(): Set<string> {
  return new Set(getVisibleThumbs().map(thumb => thumb.id));
}
