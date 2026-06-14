import { COLUMN_SELECTOR, ITEM_SELECTOR, getItemsInContainer, getThumbsInMatrix, waitForThumbsToLoadInContainer } from "@/lib/thumb/thumbs";
import { Content } from "@/app/layout/shell";
import { preloadImage } from "@/utils/dom/image";
import { sleep } from "@/lib/async/async";
import { throttle } from "@/lib/async/throttle";

export const waitForAllThumbsToLoad = (): Promise<unknown[]> => waitForThumbsToLoadInContainer(document);
export const getAllContentThumbs = (): HTMLElement[] => (usingColumnLayout() ? getThumbsInMatrix(Content) : getItemsInContainer(Content));
export const getAllPageThumbs = (): HTMLElement[] => getItemsInContainer(document);
export const noItemsAreVisible = (): boolean => Content.querySelector(ITEM_SELECTOR) === null;

export async function revealItem(id: string): Promise<void> {
  await waitForAllThumbsToLoad();
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
  await waitForAllThumbsToLoad();

  for (const url of urls) {
    await sleep(3);
    preloadImage(url);
  }
}, 2_000);

const usingColumnLayout = (): boolean => Content.querySelector(COLUMN_SELECTOR) !== null;
