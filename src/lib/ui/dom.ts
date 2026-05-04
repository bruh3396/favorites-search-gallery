import { Events } from "../communication/events";
import { Favorite } from "../../types/favorite";
import { ON_MOBILE_DEVICE } from "../environment/environment";
import { getImageFromThumb } from "../dom/thumb";
import { sleep } from "../core/scheduling/promise";
import { waitForAllThumbnailsToLoad } from "../dom/content_thumb";

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
  return new Promise((resolve) => {
    Events.document.domLoaded.on(() => resolve(), { once: true });
  });
}
export async function revealItem(id: string): Promise<void> {
  await waitForAllThumbnailsToLoad();
  const thumb = document.getElementById(id);

  if (thumb === null || thumb.classList.contains("blink")) {
    return;
  }
  thumb.scrollIntoView({ behavior: "smooth", block: "center" });
  thumb.classList.add("blink");
  await sleep(1500);
  thumb.classList.remove("blink");
}
