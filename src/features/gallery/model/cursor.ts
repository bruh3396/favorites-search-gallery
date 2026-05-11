import { NavigationBoundary } from "../types/gallery_types";
import { NavigationKey } from "../../../types/input";
import { clamp } from "../../../utils/number";
import { getAllContentThumbs } from "../../../lib/dom/content_thumb";
import { isForwardNavigationKey } from "../../../types/guards";

let currentIndex = 0;
let thumbs: HTMLElement[] = [];
const thumbIndexById: Map<string, number> = new Map();

export const getSelectedThumb = (): HTMLElement => thumbs[currentIndex];
export const move = (direction: NavigationKey): NavigationBoundary => setCurrentIndex(isForwardNavigationKey(direction) ? currentIndex + 1 : currentIndex - 1);
export const jumpToLast = (): NavigationBoundary => setCurrentIndex(getLastIndex());
export const jumpToFirst = (): NavigationBoundary => setCurrentIndex(0);

export function setCurrentThumb(thumb: HTMLElement): void {
  currentIndex = getThumbIndex(thumb);
}

export function refreshThumbs(): void {
  thumbIndexById.clear();
  thumbs = getAllContentThumbs();

  for (let i = 0; i < thumbs.length; i += 1) {
    thumbIndexById.set(thumbs[i].id, i);
  }
}

function setCurrentIndex(index: number): NavigationBoundary {
  currentIndex = clamp(index, 0, getLastIndex());

  if (index < 0) {
    return NavigationBoundary.Left;
  }
  return index >= thumbs.length ? NavigationBoundary.Right : NavigationBoundary.None;
}

function getLastIndex(): number {
  return thumbs.length - 1;
}

function getThumbIndex(thumb: HTMLElement): number {
  return thumbIndexById.get(thumb.id) ?? 0;
}
