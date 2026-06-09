import { Boundary } from "@/types/boundary";
import { NavigationKey } from "@/types/input";
import { clamp } from "@/utils/number";
import { getAllContentThumbs } from "@/app/layout/content_thumbs";
import { navigationDelta } from "@/utils/navigation";

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

export function move(direction: NavigationKey): Boundary {
  requireThumbs();
  const nextIndex = currentIndex + navigationDelta(direction);

  setCurrentIndex(nextIndex);
  return nextIndex < 0 ? "start" : nextIndex >= thumbs.length ? "end" : "none";
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

export function reIndexThumbs(): void {
  thumbIndex.clear();
  thumbs = getAllContentThumbs();

  for (let i = 0; i < thumbs.length; i += 1) {
    const thumb = thumbs[i];

    if (thumb.id === "") {
      continue;
    }

    if (thumbIndex.has(thumb.id)) {
      throw new Error(`Duplicate thumb id: ${thumb.id}`);
    }
    thumbIndex.set(thumb.id, i);
  }

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
