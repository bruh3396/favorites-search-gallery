import { ON_MOBILE_DEVICE, ON_SEARCH_PAGE } from "../../lib/globals/flags";
import { Events } from "../../lib/globals/events";
import { removeNonNumericCharacters } from "../primitive/string";

const TYPEABLE_INPUTS = new Set(["color", "email", "number", "password", "search", "tel", "text", "url", "datetime"]);
const FAVORITE_ITEM_CLASS_NAME = "favorite";
const DEFAULT_ITEM_CLASS_NAME = "thumb";

export const ITEM_CLASS_NAME = ON_SEARCH_PAGE ? DEFAULT_ITEM_CLASS_NAME : FAVORITE_ITEM_CLASS_NAME;
export const ITEM_SELECTOR = `.${ITEM_CLASS_NAME}`;
const IMAGE_SELECTOR = `.${ITEM_CLASS_NAME} ${ON_SEARCH_PAGE ? "img" : "img:first-child"}`;

export function getClosestItem(element: HTMLElement): HTMLElement | null {
  return element.closest(ITEM_SELECTOR);
}

export function getImageFromThumb(thumb: HTMLElement): HTMLImageElement | null {
  return thumb.querySelector("img");
}

export function getThumbFromImage(image: HTMLElement): HTMLElement | null {
  return getClosestItem(image);
}

export function getThumbUnderCursor(event: MouseEvent): HTMLElement | null {
  if (!(event.target instanceof HTMLElement) || event.target.matches(".caption-tag")) {
    return null;
  }
  const image = event.target.matches(IMAGE_SELECTOR) ? event.target : null;
  return image === null ? null : getThumbFromImage(image);
}

export function isHotkeyEvent(event: KeyboardEvent): boolean {
  return !event.repeat && event.target instanceof HTMLElement && !isTypeableInput(event.target);
}

export function isTypeableInput(element: HTMLElement): boolean {
  if (!(element instanceof HTMLElement)) {
    return false;
  }
  const tagName = element.tagName.toLowerCase();
  return tagName === "textarea" || (tagName === "input" && TYPEABLE_INPUTS.has(element.getAttribute("type") || ""));
}

export function insideOfThumb(element: unknown): boolean {
  return element instanceof HTMLElement && getClosestItem(element) !== null;
}

export function waitForDOMToLoad(): Promise<void> {
  if (document.readyState !== "loading") {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    Events.document.domLoaded.on(() => {
      resolve();
    }, {
      once: true
    });
  });
}

export function imageIsLoaded(image: HTMLImageElement): boolean {
  return image.complete || image.naturalWidth !== 0;
}

export function imageIsLoading(image: HTMLImageElement): boolean {
  return !imageIsLoaded(image);
}

function originalGetAllThumbs(): HTMLElement[] {
  return Array.from(document.querySelectorAll(ITEM_SELECTOR))
    .filter(thumb => thumb instanceof HTMLElement);
}

export let getAllThumbs = originalGetAllThumbs;

export function changeGetAllTHumbsImplementation(newGetAllThumbs: () => HTMLElement[]): void {
  getAllThumbs = newGetAllThumbs;
}

export function resetGetAllThumbsImplementation(): void {
  getAllThumbs = originalGetAllThumbs;
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

export function scrollToTop(): void {
  window.scrollTo(0, ON_MOBILE_DEVICE ? 10 : 0);
}

export function getItemCount(): number {
  return getAllThumbs().length;
}

export function hasTagName(element: HTMLElement | EventTarget, tagName: string): boolean {
  return element instanceof HTMLElement && element.tagName !== undefined && element.tagName.toLowerCase() === tagName;
}
