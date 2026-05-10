import { COLUMN_CLASS_NAME, ITEM_SELECTOR, getThumbsInContainer, getThumbsInMatrix, waitForThumbnailsToLoadInContainer } from "./thumb";
import { Content } from "../shell";

export const waitForAllThumbnailsToLoad = (): Promise<unknown[]> => waitForThumbnailsToLoadInContainer(document);
export const getAllContentThumbs = (): HTMLElement[] => (usingColumnLayout() ? getThumbsInMatrix(Content) : getThumbsInContainer(Content));
export const getAllPageThumbs = (): HTMLElement[] => getThumbsInContainer(document);
export const noItemsAreVisible = (): boolean => Content.querySelector(ITEM_SELECTOR) === null;
const usingColumnLayout = (): boolean => Content.querySelector(`.${COLUMN_CLASS_NAME}`) !== null;
