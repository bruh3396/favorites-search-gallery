import { ON_FAVORITES_PAGE, ON_MOBILE_DEVICE, ON_SEARCH_PAGE } from "../../../lib/environment/environment";
import { getAllContentThumbs, waitForAllThumbnailsToLoad } from "../../../lib/dom/content_thumb";
import { Events } from "../../../lib/communication/events";
import { GalleryConfig } from "../../../config/gallery_config";
import { Preferences } from "../../../lib/preferences/preferences";
import { debounceTrailing } from "../../../lib/core/scheduling/rate_limiting";
import { getRectDistance } from "../../../utils/geometry";

const visibleThumbs: Map<string, IntersectionObserverEntry> = new Map();
let centerThumb: HTMLElement | null = null;
let intersectionObserver: IntersectionObserver | null = createIntersectionObserver();
let bypassDebounce = true;

export function setupVisibleThumbObserver(): void {
  Events.favorites.pageChanged.on(() => {
    bypassDebounce = true;
  });

  if (ON_FAVORITES_PAGE) {
    Events.favorites.alternateLayoutToggled.on(recreateObserver);
  }
}

export function observe(thumbs: HTMLElement[]): void {
  if (intersectionObserver === null) {
    return;
  }

  for (const thumb of thumbs) {
    intersectionObserver.observe(thumb);
  }
}

export async function observeAllThumbsOnPage(): Promise<void> {
  if (intersectionObserver === null) {
    return;
  }
  intersectionObserver.disconnect();
  visibleThumbs.clear();

  await waitForAllThumbnailsToLoad();
  observe(getAllContentThumbs());
}

export function setCenterThumb(thumb: HTMLElement | null): void {
  centerThumb = thumb;
}

export function resetCenterThumb(): void {
  centerThumb = null;
}

export function getVisibleThumbs(): HTMLElement[] {
  const entries = Array.from(visibleThumbs.values());
  return sortByDistanceFromCenterThumb(entries)
    .map(entry => entry.target)
    .filter(target => target instanceof HTMLElement);
}

const broadcastDebounced = debounceTrailing(() => {
  Events.gallery.visibleThumbsChanged.emit();
}, GalleryConfig.preloadMediaDebounceTime);

function broadcastVisibleThumbsChanged(): void {
  if (bypassDebounce) {
    bypassDebounce = false;
    Events.gallery.visibleThumbsChanged.emit();
  } else {
    broadcastDebounced();
  }
}

function onVisibleThumbsChanged(entries: IntersectionObserverEntry[]): void {
  updateVisibleThumbs(entries);
  broadcastVisibleThumbsChanged();
}

function updateVisibleThumbs(entries: IntersectionObserverEntry[]): void {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      visibleThumbs.set(entry.target.id, entry);
    } else {
      visibleThumbs.delete(entry.target.id);
    }
  }
}

function createIntersectionObserver(): IntersectionObserver | null {
  if (ON_MOBILE_DEVICE) {
    return null;
  }

  if (ON_SEARCH_PAGE && !GalleryConfig.upscaleEverythingOnSearchPage) {
    return null;
  }
  const topMargin = Preferences.alternateLayout ? 0 : -GalleryConfig.favoritesMenuHeight;
  return new IntersectionObserver(onVisibleThumbsChanged, {
    root: null,
    rootMargin: `${topMargin}px 0px ${GalleryConfig.visibleThumbsDownwardScrollPercentageGenerosity}% 0px`,
    threshold: [0.1]
  });
}

function sortByDistanceFromCenterThumb(entries: IntersectionObserverEntry[]): IntersectionObserverEntry[] {
  if (centerThumb === null) {
    return entries;
  }
  const centerEntry = visibleThumbs.get(centerThumb.id);
  return centerEntry === undefined ? entries : sortByDistance(centerEntry, entries);
}

function sortByDistance(centerEntry: IntersectionObserverEntry, entries: IntersectionObserverEntry[]): IntersectionObserverEntry[] {
  return entries.sort((a, b) => {
    const distanceA = getRectDistance(centerEntry.boundingClientRect, a.boundingClientRect);
    const distanceB = getRectDistance(centerEntry.boundingClientRect, b.boundingClientRect);
    return distanceA - distanceB;
  });
}

function recreateObserver(): void {
  if (intersectionObserver !== null) {
    intersectionObserver.disconnect();
    intersectionObserver = createIntersectionObserver();
    observeAllThumbsOnPage();
  }
}
