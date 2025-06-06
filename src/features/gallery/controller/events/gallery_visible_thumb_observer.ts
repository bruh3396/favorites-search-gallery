import { getAllThumbs, getRectDistance, waitForAllThumbnailsToLoad } from "../../../../utils/dom/dom";
import { Events } from "../../../../lib/globals/events";
import { GallerySettings } from "../../../../config/gallery_settings";
import { ON_MOBILE_DEVICE } from "../../../../lib/globals/flags";
import { debounceAlways } from "../../../../utils/misc/async";

const visibleThumbs: Map<string, IntersectionObserverEntry> = new Map();
let centerThumb: HTMLElement | null = null;
let intersectionObserver: IntersectionObserver = createIntersectionObserver(getInitialFavoritesMenuHeight());

export function setupVisibleThumbObserver(): void {
  if (ON_MOBILE_DEVICE) {
    return;
  }
  updateRootMarginWhenMenuResizes();
}

function onVisibleThumbsChanged(entries: IntersectionObserverEntry[]): void {
  updateVisibleThumbs(entries);
  broadcastVisibleThumbsChanged(entries);
}

const broadcastVisibleThumbsChanged = debounceAlways((entries: IntersectionObserverEntry[]) => {
  Events.gallery.visibleThumbsChanged.emit(entries);
}, 250);

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
  const menu = document.getElementById("favorites-search-gallery-menu");

  if (menu === null) {
    return 0;
  }
  return -menu.offsetHeight;
}

function createIntersectionObserver(topMargin: number = 0): IntersectionObserver {
  return new IntersectionObserver(onVisibleThumbsChanged, {
    root: null,
    rootMargin: getFinalRootMargin(topMargin),
    threshold: [0.1]
  });
}

function getFinalRootMargin(topMargin: number): string {
  return `${topMargin}px 0px ${GallerySettings.visibleThumbsDownwardScrollPixelGenerosity}px 0px`;
}

function updateRootMarginWhenMenuResizes(): void {
  const menu = document.getElementById("favorites-search-gallery-menu");
  let resizedOnce = false;

  if (menu === null) {
    return;
  }
  const onMenuResized = debounceAlways(() => {
    if (resizedOnce) {
      intersectionObserver.disconnect();
      intersectionObserver = createIntersectionObserver(-menu.offsetHeight);
      observeAllThumbsOnPage();
    }
    resizedOnce = true;
  }, 300);

  Events.document.postProcess.on(() => {
    const resizeObserver = new ResizeObserver(() => {
      onMenuResized();
    });

    resizeObserver.observe(menu);
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
