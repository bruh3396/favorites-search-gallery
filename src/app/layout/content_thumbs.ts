import { COLUMN_SELECTOR, ITEM_SELECTOR, getThumbsInContainer, getThumbsInMatrix, waitForThumbnailsToLoadInContainer } from "@/lib/thumb/thumbs";
import { Content } from "@/app/layout/shell";
import { preloadImage } from "@/utils/dom/image";
import { sleep } from "@/lib/async/timing";
import { throttle } from "@/lib/async/throttle";

export const waitForAllThumbnailsToLoad = (): Promise<unknown[]> => waitForThumbnailsToLoadInContainer(document);
export const getAllContentThumbs = (): HTMLElement[] => (usingColumnLayout() ? getThumbsInMatrix(Content) : getThumbsInContainer(Content));
export const getAllPageThumbs = (): HTMLElement[] => getThumbsInContainer(document);
export const noItemsAreVisible = (): boolean => Content.querySelector(ITEM_SELECTOR) === null;

export async function revealItem(id: string): Promise<void> {
  await waitForAllThumbnailsToLoad();
  const thumb = document.getElementById(id);

  if (thumb === null || thumb.classList.contains("u-blink")) {
    return;
  }
  thumb.scrollIntoView({ behavior: "smooth", block: "center" });
  thumb.classList.add("u-blink");
  await sleep(1_500);
  thumb.classList.remove("u-blink");
}

export const preloadImages = throttle(async(urls: string[]) => {
  await waitForAllThumbnailsToLoad();

  for (const url of urls) {
    await sleep(3);
    preloadImage(url);
  }
}, 2_000);

const usingColumnLayout = (): boolean => Content.querySelector(COLUMN_SELECTOR) !== null;
