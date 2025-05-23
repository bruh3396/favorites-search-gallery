import { ContentType } from "../../types/primitives/primitives";
import { ON_FAVORITES_PAGE } from "../../lib/globals/flags";
import { getContentType } from "../primitive/string";
import { getFavorite } from "../../features/favorites/types/favorite/favorite_item";
import { getImageFromThumb } from "../dom/dom";
import { getTagSetFromThumb } from "../dom/tags";

function isContentTypeOnFavoritesPage(thumb: HTMLElement, contentType: ContentType): boolean {
  const favorite = getFavorite(thumb.id);
  return favorite !== undefined && getContentType(favorite.tags) === contentType;
}

function isContentTypeOnSearchPage(thumb: HTMLElement, contentType: ContentType): boolean {
  const image = getImageFromThumb(thumb);
  return image !== null && getContentType(getTagSetFromThumb(thumb)) === contentType;
}

const isContentType = ON_FAVORITES_PAGE ? isContentTypeOnFavoritesPage : isContentTypeOnSearchPage;

export const isVideo = (thumb: HTMLElement): boolean => isContentType(thumb, "video");
export const isGif = (thumb: HTMLElement): boolean => isContentType(thumb, "gif");
export const isImage = (thumb: HTMLElement): boolean => isContentType(thumb, "image");
