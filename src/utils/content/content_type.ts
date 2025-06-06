import { ContentType } from "../../types/primitives/primitives";
import { Favorite } from "../../types/interfaces/interfaces";
import { getContentType } from "../primitive/string";
import { getImageFromThumb } from "../dom/dom";
import { getTagSetFromThumb } from "../dom/tags";

function isFavoriteContentType(favorite: Favorite, contentType: ContentType): boolean {
  return getContentType(favorite.tags) === contentType;
}

function isThumbContentType(thumb: HTMLElement, contentType: ContentType): boolean {
  const image = getImageFromThumb(thumb);
  return image !== null && getContentType(getTagSetFromThumb(thumb)) === contentType;
}

function isContentType(object: HTMLElement | Favorite, contentType: ContentType): boolean {
  if (object instanceof HTMLElement) {
    return isThumbContentType(object, contentType);
  }
  return isFavoriteContentType(object, contentType);
}

export const isVideo = (object: HTMLElement | Favorite): boolean => isContentType(object, "video");
export const isGif = (object: HTMLElement | Favorite): boolean => isContentType(object, "gif");
export const isImage = (object: HTMLElement | Favorite): boolean => isContentType(object, "image");
