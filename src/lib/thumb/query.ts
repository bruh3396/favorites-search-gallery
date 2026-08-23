import { IMAGE_SELECTOR, ITEM_SELECTOR } from "@/lib/thumb/selectors";
import { sum } from "@/utils/pure/number";

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

function getClosestThumb(element: HTMLElement): HTMLElement | null {
  return element.closest(ITEM_SELECTOR);
}
