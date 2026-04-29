import { COLUMN_CLASS_NAME, getThumbsInContainer, getThumbsInMatrix, waitForThumbnailsToLoadInContainer } from "./thumb";
import { CONTENT } from "../shell";

function usingColumnLayout(): boolean {
  return CONTENT.querySelector(`.${COLUMN_CLASS_NAME}`) !== null;
}

export function waitForAllThumbnailsToLoad(): Promise<unknown[]> {
  return waitForThumbnailsToLoadInContainer(document);
}

export function getAllContentThumbs(): HTMLElement[] {
  return usingColumnLayout() ? getThumbsInMatrix(CONTENT) : getThumbsInContainer(CONTENT);
}

export function getAllPageThumbs(): HTMLElement[] {
  return getThumbsInContainer(document);
}
