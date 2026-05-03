import { Favorite } from "../../types/favorite";
import { MediaType } from "../../types/media";
import { getImageFromThumb } from "../dom/thumb";
import { getTagSetFromItem } from "../dom/tags";
import { resolveMediaType } from "./media_type_resolver";

export const isVideo = (item: HTMLElement | Favorite): boolean => isMediaType(item, "video");
export const isGif = (item: HTMLElement | Favorite): boolean => isMediaType(item, "gif");
export const isImage = (item: HTMLElement | Favorite): boolean => isMediaType(item, "image");

function isFavoriteMediaType(favorite: Favorite, mediaType: MediaType): boolean {
  return resolveMediaType(favorite.tags) === mediaType;
}

function isThumbMediaType(thumb: HTMLElement, mediaType: MediaType): boolean {
  return getImageFromThumb(thumb) !== null && resolveMediaType(getTagSetFromItem(thumb)) === mediaType;
}

function isMediaType(item: HTMLElement | Favorite, mediaType: MediaType): boolean {
  return (item instanceof HTMLElement) ? isThumbMediaType(item, mediaType) : isFavoriteMediaType(item, mediaType);
}
