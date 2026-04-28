import { ON_MOBILE_DEVICE, ON_SEARCH_PAGE } from "../../../../../lib/environment/environment";
import { getRectDistance } from "../../../../../utils/dom/interaction";
import { waitForAllThumbnailsToLoad } from "../../../../../utils/dom/thumb";
import { getAllThumbs } from "../../../../../utils/dom/thumb";
import { Events } from "../../../../../lib/events/events";
import { GallerySettings } from "../../../../../config/gallery_settings";
import { Preferences } from "../../../../../lib/preferences/preferences";
import { debounceAlways } from "../../../../../lib/core/async/rate_limiter";

const VISIBLE_THUMBS: Map<string, IntersectionObserverEntry> = new Map();
let centerThumb: HTMLElement | null = null;
let intersectionObserver: IntersectionObserver | null = createIntersectionObserver();
let bypassDebounce = true;

const broadcastDebounceAlways = debounceAlways(() => {
  Events.gallery.visibleThumbsChanged.emit();
}, GallerySettings.preloadContentDebounceTime);

function broadcastVisibleThumbsChanged(): void {
  if (bypassDebounce) {
    bypassDebounce = false;
    Events.gallery.visibleThumbsChanged.emit();
  } else {
    broadcastDebounceAlways();
  }
}

function onVisibleThumbsChanged(entries: IntersectionObserverEntry[]): void {
  updateVisibleThumbs(entries);
  broadcastVisibleThumbsChanged();
}

function updateVisibleThumbs(entries: IntersectionObserverEntry[]): void {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      VISIBLE_THUMBS.set(entry.target.id, entry);
    } else {
      VISIBLE_THUMBS.delete(entry.target.id);
    }
  }
}

function getInitialFavoritesMenuHeight(): number {
  return -200;
}

function getTopMargin(): number {
  return Preferences.alternateLayout ? 0 : getInitialFavoritesMenuHeight();
}

function createIntersectionObserver(): IntersectionObserver | null {
  if (ON_MOBILE_DEVICE) {
    return null;
  }

  if (ON_SEARCH_PAGE && !GallerySettings.upscaleEverythingOnSearchPage) {
    return null;
  }
  return new IntersectionObserver(onVisibleThumbsChanged, {
    root: null,
    rootMargin: getFinalRootMargin(),
    threshold: [0.1]
  });
}

function getFinalRootMargin(): string {
  return `${getTopMargin()}px 0px ${GallerySettings.visibleThumbsDownwardScrollPercentageGenerosity}% 0px`;
}

function sortByDistanceFromCenterThumb(entries: IntersectionObserverEntry[]): IntersectionObserverEntry[] {
  if (centerThumb === null) {
    return entries;
  }
  const centerEntry = VISIBLE_THUMBS.get(centerThumb.id);
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
  VISIBLE_THUMBS.clear();

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
  const entries = Array.from(VISIBLE_THUMBS.values());
  return sortByDistanceFromCenterThumb(entries)
    .map(entry => entry.target)
    .filter(target => target instanceof HTMLElement);
}

export function setupVisibleThumbObserver(): void {
  bypassDebounceAlwaysOnPageChange();
  Events.favorites.alternateLayoutToggled.on(adjustRootMargin);

  if (ON_SEARCH_PAGE) {
    observeAllThumbsOnPage();
  }
}

export function adjustRootMargin(): void {
  if (intersectionObserver !== null) {
    intersectionObserver.disconnect();
    intersectionObserver = createIntersectionObserver();
    observeAllThumbsOnPage();
  }
}
