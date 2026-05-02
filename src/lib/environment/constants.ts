import { MediaExtension } from "../../types/media";

export const POSTS_PER_SEARCH_PAGE = 42;
export const ALL_RATINGS_VALUE = 7;
export const FAVORITES_PER_PAGE = 50;
export const DEFAULT_EXTENSION: MediaExtension = "jpg";

export const extensionRegex = (/\.(png|jpg|jpeg|gif|mp4)$/);
export const doNothing = (): void => { };
