import { Favorite } from "../types/favorite_data_types";
import { MediaType } from "../types/common_types";
import { convertToTagSet } from "../utils/string/tags";
import { getImageFromThumb } from "./dom/thumb";
import { getTagSetFromItem } from "../utils/tags";

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

export function resolveMediaType(tags: string | Set<string>): MediaType {
  const tagSet = typeof tags === "string" ? convertToTagSet(tags) : tags;

  if (tagSet.has("video") || tagSet.has("mp4")) {
    return "video";
  }
  return (tagSet.has("gif") || tagSet.has("animated")) ? "gif" : "image";
}
