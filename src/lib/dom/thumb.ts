import { imageIsLoading } from "../../utils/dom/image";
import { removeNonNumericCharacters } from "../../utils/string/format";

export const ITEM_CLASS_NAME = "favorite";
export const ITEM_SELECTOR = ".favorite, .thumb";
export const IMAGE_SELECTOR = ".favorite img";
export const COLUMN_CLASS_NAME = "actual-column";

function getClosestThumb(element: HTMLElement): HTMLElement | null {
  return element.closest(ITEM_SELECTOR);
}

export function getThumbsInContainer(container: HTMLElement | Document): HTMLElement[] {
  return Array.from(container.querySelectorAll(ITEM_SELECTOR)).filter(thumb => thumb instanceof HTMLElement);
}

export function getThumbsInMatrix(container: HTMLElement): HTMLElement[] {
    const itemCount = Array.from(container.querySelectorAll(ITEM_SELECTOR)).length;
    const columns = Array.from(container.children);
    const result: HTMLElement[] = [];
    const matrix = columns.map(column => Array.from(column.querySelectorAll(ITEM_SELECTOR)));

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
  if (!(event.target instanceof HTMLElement) || event.target.matches(".caption-tag")) {
    return null;
  }
  const image = event.target.matches(IMAGE_SELECTOR) ? event.target : null;
  return image === null ? null : getThumbFromImage(image);
}

export function insideOfThumb(element: unknown): boolean {
  return element instanceof HTMLElement && getClosestThumb(element) !== null;
}

export function waitForThumbnailsToLoadInContainer(container: HTMLElement | Document): Promise<unknown[]> {
  const unloadedImages = getThumbsInContainer(container)
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
