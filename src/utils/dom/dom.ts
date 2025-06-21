import { ON_MOBILE_DEVICE, ON_SEARCH_PAGE } from "../../lib/global/flags/intrinsic_flags";
import { Events } from "../../lib/global/events/events";
import { Favorite } from "../../types/interfaces/interfaces";
import { insertStyleHTML } from "./style";
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

export function getPreviewURL(item: HTMLElement | Favorite): string | null {
  if (!(item instanceof HTMLElement)) {
    return item.thumbURL;
  }
  const image = getImageFromThumb(item);
  return image ? image.src : null;
}

export function getThumbUnderCursor(event: MouseEvent | TouchEvent): HTMLElement | null {
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
  const tagName = element.tagName.toLowerCase();
  return tagName === "textarea" || (tagName === "input" && TYPEABLE_INPUTS.has(element.getAttribute("type") ?? ""));
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

export function getRectDistance(rect1: DOMRectReadOnly, rect2: DOMRectReadOnly): number {
  const x1 = rect1.left + (rect1.width / 2);
  const y1 = rect1.top + (rect1.height / 2);
  const x2 = rect2.left + (rect2.width / 2);
  const y2 = rect2.top + (rect2.height / 2);
  return Math.sqrt(((x2 - x1) ** 2) + ((y2 - y1) ** 2));
}

export function toggleFullscreen(): void {
  const html = document.documentElement;

  if (document.fullscreenElement === null) {
    html.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

export function overGalleryMenu(event: MouseEvent): boolean {
  if (!(event.target instanceof HTMLElement)) {
    return false;
  }
  return event.target.classList.contains(".gallery-sub-menu") || event.target.closest(".gallery-sub-menu") !== null;
}

export function toggleGalleryMenuEnabled(value: boolean): void {
  insertStyleHTML(`
        #gallery-menu {
          visibility: ${value ? "visible" : "hidden"} !important;
        }`, "enable-gallery-menu");
}

export function showFullscreenIcon(svg: string, duration: number = 500): void {
  const svgDocument = new DOMParser().parseFromString(svg, "image/svg+xml");
  const svgElement = svgDocument.documentElement;
  const svgOverlay = document.createElement("div");

  svgOverlay.classList.add("fullscreen-icon");
  svgOverlay.innerHTML = new XMLSerializer().serializeToString(svgElement);
  document.body.appendChild(svgOverlay);
  setTimeout(() => {
    svgOverlay.remove();
  }, duration);
}

export function blurCurrentlyFocusedElement(): void {
  const activeElement = document.activeElement;

  if (activeElement instanceof HTMLElement) {
    activeElement.blur();
  }
}
