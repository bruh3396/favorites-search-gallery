import { COLUMN_CLASS_NAME, ITEM_SELECTOR, getThumbsInContainer, getThumbsInMatrix, waitForThumbnailsToLoadInContainer } from "../../lib/thumb/thumbs";
import { Content } from "./shell";
import { sleep } from "../../lib/async/sleep";

export const waitForAllThumbnailsToLoad = (): Promise<unknown[]> => waitForThumbnailsToLoadInContainer(document);
export const getAllContentThumbs = (): HTMLElement[] => (usingColumnLayout() ? getThumbsInMatrix(Content) : getThumbsInContainer(Content));
export const getAllPageThumbs = (): HTMLElement[] => getThumbsInContainer(document);
export const noItemsAreVisible = (): boolean => Content.querySelector(ITEM_SELECTOR) === null;
const usingColumnLayout = (): boolean => Content.querySelector(`.${COLUMN_CLASS_NAME}`) !== null;

export async function revealItem(id: string): Promise<void> {
  await waitForAllThumbnailsToLoad();
  const thumb = document.getElementById(id);

  if (thumb === null || thumb.classList.contains("u-blink")) {
    return;
  }
  thumb.scrollIntoView({ behavior: "smooth", block: "center" });
  thumb.classList.add("u-blink");
  await sleep(1500);
  thumb.classList.remove("u-blink");
}
