import { MediaExtension } from "../../types/media";

export const POSTS_PER_SEARCH_PAGE = 42;
export const ALL_RATINGS_VALUE = 7;
export const FAVORITES_PER_PAGE = 50;
export const DO_NOTHING = (): void => { };
export const EXTENSION_REGEX = (/\.(png|jpg|jpeg|gif|mp4)$/);
export const EXTENSIONS: MediaExtension[] = ["jpg", "png", "jpeg"];
export const DEFAULT_EXTENSION: MediaExtension = "jpg";
