import { Boundary } from "../types/gallery_types";
import { NavigationKey } from "../../../types/input";
import { clamp } from "../../../utils/number";
import { getAllContentThumbs } from "../../../lib/dom/content_thumb";
import { isForwardNavigationKey } from "../../../types/guards";

let currentIndex = 0;
let thumbs: HTMLElement[] = [];
const thumbIndex: Map<string, number> = new Map();

export function jumpToLast(): void {
  requireThumbs();
  setCurrentIndex(thumbs.length - 1);
}

export function jumpToFirst(): void {
  requireThumbs();
  setCurrentIndex(0);
}

export function move(key: NavigationKey): Boundary {
  requireThumbs();
  const delta = isForwardNavigationKey(key) ? 1 : -1;
  const nextIndex = currentIndex + delta;

  setCurrentIndex(nextIndex);
  return nextIndex < 0 ? Boundary.Start : nextIndex >= thumbs.length ? Boundary.End : Boundary.None;
}

export function currentThumb(): HTMLElement {
  requireThumbs();
  const thumb = thumbs[currentIndex];

  if (thumb === undefined) {
    throw new Error(`Could not get thumb at index: ${currentIndex}`);
  }
  return thumb;
}

export function pointTo(thumb: HTMLElement): void {
  requireThumbs();
  const index = thumbIndex.get(thumb.id);

  if (index === undefined) {
    throw new Error(`Could not find thumb with id: ${thumb.id}`);
  }
  setCurrentIndex(index);
}

export function refreshThumbs(): void {
  thumbIndex.clear();
  thumbs = getAllContentThumbs();
  thumbs.forEach((t, i) => {
    if (thumbIndex.has(t.id)) {
      throw new Error(`Duplicate thumb id: ${t.id}`);
    }
    thumbIndex.set(t.id, i);
  });

  if (thumbs.length === 0 || currentIndex >= thumbs.length) {
    currentIndex = 0;
  }
}

function requireThumbs(): void {
  if (thumbs.length === 0) {
    throw new Error("Tried to navigate without thumbs");
  }
}

function setCurrentIndex(index: number): void {
  currentIndex = clamp(index, 0, thumbs.length - 1);
}
