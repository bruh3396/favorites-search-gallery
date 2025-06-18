import { FavoriteItem, getFavorite } from "../../features/favorites/types/favorite/favorite_item";
import { convertToTagSet, getContentType } from "../primitive/string";
import { ContentType } from "../../types/primitives/primitives";
import { ON_FAVORITES_PAGE } from "../../lib/globals/flags";
import { getImageFromThumb } from "./dom";

function getTagAttributeFromImage(image: HTMLImageElement): string {
  return image.hasAttribute("tags") ? "tags" : "title";
}

function getTagsFromThumbOnSearchPage(thumb: HTMLElement | FavoriteItem): string {
  if (!(thumb instanceof HTMLElement)) {
    return "";
  }
  const image = getImageFromThumb(thumb);

  if (image === null) {
    return "";
  }
  const tagAttribute = getTagAttributeFromImage(image);
  return image.getAttribute(tagAttribute) || "";
}

function getTagSetFromThumbOnSearchPage(thumb: HTMLElement): Set<string> {
  return convertToTagSet(getTagsFromThumbOnSearchPage(thumb));
}

function getTagSetFromThumbOnFavoritesPage(thumb: HTMLElement): Set<string> {
  const favorite = getFavorite(thumb.id);
  return favorite === undefined ? new Set() : favorite.tags;
}

export const getTagSetFromThumb = ON_FAVORITES_PAGE ? getTagSetFromThumbOnFavoritesPage : getTagSetFromThumbOnSearchPage;

export function getContentTypeFromThumb(thumb: HTMLElement): ContentType {
  return getContentType(getTagSetFromThumb(thumb));
}

export function moveTagsFromTitleToTagsAttribute(thumb: HTMLElement): void {
  const image = getImageFromThumb(thumb);

  if (image === null || !image.hasAttribute("title")) {
    return;
  }
  image.setAttribute("tags", image.title);
  image.removeAttribute("title");
}
