import { COLUMN_CLASS_NAME, getThumbsInContainer, getThumbsInMatrix, waitForThumbnailsToLoadInContainer } from "./thumb";
import { Content } from "../shell";

function usingColumnLayout(): boolean {
  return Content.querySelector(`.${COLUMN_CLASS_NAME}`) !== null;
}

export function waitForAllThumbnailsToLoad(): Promise<unknown[]> {
  return waitForThumbnailsToLoadInContainer(document);
}

export function getAllContentThumbs(): HTMLElement[] {
  return usingColumnLayout() ? getThumbsInMatrix(Content) : getThumbsInContainer(Content);
}

export function getAllPageThumbs(): HTMLElement[] {
  return getThumbsInContainer(document);
}
