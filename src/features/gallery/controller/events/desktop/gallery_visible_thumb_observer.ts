import { getAllThumbs, getRectDistance, waitForAllThumbnailsToLoad } from "../../../../../utils/dom/dom";
import { Events } from "../../../../../lib/global/events/events";
import { GallerySettings } from "../../../../../config/gallery_settings";
import { ON_FAVORITES_PAGE } from "../../../../../lib/global/flags/intrinsic_flags";
import { debounceAlways } from "../../../../../utils/misc/async";

const visibleThumbs: Map<string, IntersectionObserverEntry> = new Map();
let centerThumb: HTMLElement | null = null;
const intersectionObserver: IntersectionObserver = createIntersectionObserver(getInitialFavoritesMenuHeight());
let bypassDebounce = true;

const broadcastDebounceAlways = debounceAlways((entries: IntersectionObserverEntry[]) => {
  Events.gallery.visibleThumbsChanged.emit(entries);
}, GallerySettings.preloadContentDebounceTime);

function broadcastVisibleThumbsChanged(entries: IntersectionObserverEntry[]): void {
  if (bypassDebounce) {
    bypassDebounce = false;
    Events.gallery.visibleThumbsChanged.emit(entries);
  } else {
    broadcastDebounceAlways(entries);
  }
}

function onVisibleThumbsChanged(entries: IntersectionObserverEntry[]): void {
  updateVisibleThumbs(entries);
  broadcastVisibleThumbsChanged(entries);
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

function getInitialFavoritesMenuHeight(): number {
  return -200;
}

function createIntersectionObserver(topMargin: number = 0): IntersectionObserver {
  return new IntersectionObserver(onVisibleThumbsChanged, {
    root: null,
    rootMargin: getFinalRootMargin(topMargin),
    threshold: [0.1]
  });
}

function getFinalRootMargin(topMargin: number): string {
  // return `${topMargin}px 0px ${GallerySettings.visibleThumbsDownwardScrollPixelGenerosity}px 0px`;
  return `${topMargin}px 0px ${GallerySettings.visibleThumbsDownwardScrollPercentageGenerosity}% 0px`;
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

function bypassDebounceAlwaysOnPageChange(): void {
  Events.favorites.pageChanged.on(() => {
    bypassDebounce = true;
  });
}

export function observe(thumbs: HTMLElement[]): void {
  for (const thumb of thumbs) {
    intersectionObserver.observe(thumb);
  }
}

export async function observeAllThumbsOnPage(): Promise<void> {
  intersectionObserver.disconnect();
  visibleThumbs.clear();

  await waitForAllThumbnailsToLoad();
  observe(getAllThumbs());
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

export function setupVisibleThumbObserver(): void {
  if (!ON_FAVORITES_PAGE) {
    return;
  }
  bypassDebounceAlwaysOnPageChange();
}
