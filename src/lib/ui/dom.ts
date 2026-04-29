import { Events } from "../communication/events/events";
import { Favorite } from "../../types/favorite";
import { ON_MOBILE_DEVICE } from "../environment/environment";
import { getImageFromThumb } from "../dom/thumb";

export function getPreviewURL(item: HTMLElement | Favorite): string | null {
  if (item instanceof HTMLElement) {
    const image = getImageFromThumb(item);
    return image ? image.src : null;
  }
  return item.thumbUrl;
}

export function scrollToTop(): void {
  window.scrollTo(0, ON_MOBILE_DEVICE ? 10 : 0);
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
