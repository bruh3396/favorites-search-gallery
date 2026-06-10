import { ON_MOBILE_DEVICE, ON_POST_LIST_PAGE } from "@/lib/environment";
import { getAllContentThumbs, waitForAllThumbsToLoad } from "@/app/layout/content_thumbs";
import { GalleryConfig } from "@/config/gallery_config";
import { debounceTrailing } from "@/lib/async/debounce";
import { getRectDistance } from "@/utils/geometry";

class VisibleThumbObserver {
  private readonly observer: IntersectionObserver;
  private readonly visibleThumbs: Map<string, IntersectionObserverEntry> = new Map();
  private centerThumb: HTMLElement | null = null;
  private suppressNextBroadcast: boolean = false;
  private readonly scheduleBroadcast: () => void;

  public constructor(onVisibleThumbsChanged: () => void) {
    this.scheduleBroadcast = debounceTrailing(onVisibleThumbsChanged, GalleryConfig.preloadMediaDebounceTime);
    this.observer = new IntersectionObserver(entries => this.onIntersection(entries), {
      root: null,
      rootMargin: `0px 0px ${GalleryConfig.bottomOverscanPercent}% 0px`,
      threshold: 0
    });
  }

  public observe(thumbs: HTMLElement[]): void {
    thumbs.forEach(thumb => this.observer.observe(thumb));
  }

  public async refresh(): Promise<void> {
    this.observer.disconnect();
    this.visibleThumbs.clear();
    await waitForAllThumbsToLoad();
    this.suppressNextBroadcast = true;
    this.observe(getAllContentThumbs());
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

export function observe(thumbs: HTMLElement[]): void {
  instance?.observe(thumbs);
}

export async function refresh(): Promise<void> {
  await instance?.refresh();
}

export function setCenterThumb(thumb: HTMLElement | null): void {
  instance?.setCenterThumb(thumb);
}

export function resetCenterThumb(): void {
  instance?.setCenterThumb(null);
}

export function getVisibleThumbs(): HTMLElement[] {
  return instance?.getVisible() ?? [];
}
