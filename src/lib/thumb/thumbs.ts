import { ON_MOBILE_DEVICE } from "@/lib/environment";
import { imageIsLoading } from "@/utils/dom/image";
import { removeNonNumericCharacters } from "@/utils/string/format";
import { sum } from "@/utils/number";

export const ITEM_CLASS_NAME = "post";
export const TILE_CLASS_NAME = "tile";
export const RAW_THUMB_CLASS_NAME = "thumb";
export const ITEM_SELECTOR = `.${ITEM_CLASS_NAME}, .${RAW_THUMB_CLASS_NAME}`;
export const IMAGE_SELECTOR = `.${ITEM_CLASS_NAME} img`;
export const COLUMN_SELECTOR = "[data-tiler-column]";

export function getItemsInContainer(container: HTMLElement | Document): HTMLElement[] {
  return Array.from(container.querySelectorAll(ITEM_SELECTOR)).filter(item => item instanceof HTMLElement);
}

export function getThumbsInMatrix(container: HTMLElement): HTMLElement[] {
  const columns = Array.from(container.children);
  const matrix = columns.map(column => Array.from(column.querySelectorAll(ITEM_SELECTOR)));
  const itemCount = sum(matrix.map(column => column.length));
  const result: HTMLElement[] = [];

  for (let i = 0; i < itemCount; i += 1) {
    const column = i % columns.length;
    const row = Math.floor(i / columns.length);
    const item = matrix[column][row];

    if (item instanceof HTMLElement) {
      result.push(item);
    }
  }
  return result;
}

export function getImageFromThumb(thumb: HTMLElement): HTMLImageElement | null {
  return thumb.querySelector("img");
}

export function getThumbFromImage(image: HTMLElement): HTMLElement | null {
  return getClosestThumb(image);
}

export function getIdFromThumb(thumb: HTMLElement): string {
  const id = thumb.getAttribute("id");

  if (id !== null) {
    return removeNonNumericCharacters(id);
  }
  const anchor = thumb.querySelector("a");

  if (anchor !== null && anchor.hasAttribute("id")) {
    return removeNonNumericCharacters(anchor.id);
  }

  if (anchor !== null && anchor.hasAttribute("href")) {
    const match = (/id=(\d+)$/).exec(anchor.href);

    if (match !== null) {
      return match[1];
    }
  }
  const image = thumb.querySelector("img");

  if (image === null) {
    return "NA";
  }
  const match = (/\?(\d+)$/).exec(image.src);
  return match === null ? "NA" : match[1];
}

export function getThumbUnderCursor(event: MouseEvent | TouchEvent): HTMLElement | null {
  if (!(event.target instanceof HTMLElement) || event.target.matches(".post-overlay-tag")) {
    return null;
  }
  const image = event.target.matches(IMAGE_SELECTOR) ? event.target : null;
  return image === null ? null : getThumbFromImage(image);
}

export function insideOfThumb(element: unknown): boolean {
  return element instanceof HTMLElement && getClosestThumb(element) !== null;
}

export function getThumbAtPoint(x: number, y: number): HTMLElement | null {
  const element = document.elementFromPoint(x, y);
  return element instanceof HTMLElement ? getClosestThumb(element) : null;
}

export function waitForThumbsToLoadInContainer(container: HTMLElement | Document): Promise<unknown[]> {
  const unloadedImages = getItemsInContainer(container)
    .map(thumb => getImageFromThumb(thumb))
    .filter(image => image instanceof HTMLImageElement)
    .filter(image => image.dataset.preload !== "true" && imageIsLoading(image));
  return Promise.all(unloadedImages
    .map(image => new Promise(resolve => {
      image.addEventListener("load", resolve, {
        once: true
      });
      image.addEventListener("error", resolve, {
        once: true
      });
    })));
}

export function scrollToTop(): void {
  window.scrollTo(0, ON_MOBILE_DEVICE ? 10 : 0);
}

function getClosestThumb(element: HTMLElement): HTMLElement | null {
  return element.closest(ITEM_SELECTOR);
}
