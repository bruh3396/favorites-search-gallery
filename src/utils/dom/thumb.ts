import { removeNonNumericCharacters } from "../string/format";

export const ITEM_CLASS_NAME = "favorite";
export const ITEM_SELECTOR = ".favorite, .thumb";
export const IMAGE_SELECTOR = ".favorite img";
export let getAllThumbs = originalGetAllThumbs;

function getClosestItem(element: HTMLElement): HTMLElement | null {
  return element.closest(ITEM_SELECTOR);
}

function originalGetAllThumbs(): HTMLElement[] {
  return Array.from(document.querySelectorAll(ITEM_SELECTOR)).filter(thumb => thumb instanceof HTMLElement);
}

export function imageIsLoaded(image: HTMLImageElement): boolean {
  return image.complete || image.naturalWidth !== 0;
}

export function imageIsLoading(image: HTMLImageElement): boolean {
  return !imageIsLoaded(image);
}

export function changeGetAllThumbsImplementation(newGetAllThumbs: () => HTMLElement[]): void {
  getAllThumbs = newGetAllThumbs;
}

export function resetGetAllThumbsImplementation(): void {
  getAllThumbs = originalGetAllThumbs;
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

export function getImageFromThumb(thumb: HTMLElement): HTMLImageElement | null {
  return thumb.querySelector("img");
}

export function getThumbFromImage(image: HTMLElement): HTMLElement | null {
  return getClosestItem(image);
}

export function getThumbUnderCursor(event: MouseEvent | TouchEvent): HTMLElement | null {
  if (!(event.target instanceof HTMLElement) || event.target.matches(".caption-tag")) {
    return null;
  }
  const image = event.target.matches(IMAGE_SELECTOR) ? event.target : null;
  return image === null ? null : getThumbFromImage(image);
}

export function insideOfThumb(element: unknown): boolean {
  return element instanceof HTMLElement && getClosestItem(element) !== null;
}

export function waitForAllThumbnailsToLoad(): Promise<unknown[]> {
  const unloadedImages = getAllThumbs()
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
