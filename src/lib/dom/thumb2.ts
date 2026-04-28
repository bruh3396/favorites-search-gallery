import { COLUMN_CLASS_NAME, getItemsInContainer, getItemsInMatrix, waitForThumbnailsToLoadInContainer } from "./thumb";
import { CONTENT } from "../shell";

function usingColumns(): boolean {
  return CONTENT.querySelector(`.${COLUMN_CLASS_NAME}`) !== null;
}

export function waitForAllThumbnailsToLoad(): Promise<unknown[]> {
  return waitForThumbnailsToLoadInContainer(document);
}

export function getAllThumbs(): HTMLElement[] {
  return usingColumns() ? getItemsInMatrix(CONTENT) : getItemsInContainer(CONTENT);
}
