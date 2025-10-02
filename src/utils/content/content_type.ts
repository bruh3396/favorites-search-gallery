import { convertToTagString, getContentType } from "../primitive/string";
import { ContentType } from "../../types/common_types";
import { Favorite } from "../../types/favorite_types";
import { ON_SEARCH_PAGE } from "../../lib/global/flags/intrinsic_flags";
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

export function forceImageContentType(thumb: HTMLElement): void {
  if (!ON_SEARCH_PAGE) {
    return;
  }
  const tagSet = getTagSetFromThumb(thumb);

  tagSet.delete("video");
  tagSet.delete("gif");
  tagSet.delete("mp4");
  tagSet.delete("animated");
  thumb.classList.remove("gif");
  thumb.classList.remove("video");
  const image = getImageFromThumb(thumb);

  if (image === null) {
    return;
  }
  image.classList.remove("gif");
  image.classList.remove("video");
  image.setAttribute("tags", convertToTagString(tagSet));
}
