import { convertToTagSet, getContentType } from "../primitive/string";
import { ContentType } from "../../types/common_types";
import { Favorite } from "../../types/favorite_types";
import { ON_FAVORITES_PAGE } from "../../lib/global/flags/intrinsic_flags";
import { getFavorite } from "../../features/favorites/types/favorite/favorite_item";
import { getImageFromThumb } from "./dom";

function getTagAttributeFromImage(image: HTMLImageElement): string {
  return image.hasAttribute("tags") ? "tags" : "title";
}

function getTagsFromItemOnSearchPage(thumb: HTMLElement | Favorite): string {
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

function getTagSetFromItemOnSearchPage(thumb: HTMLElement | Favorite): Set<string> {
  return convertToTagSet(getTagsFromItemOnSearchPage(thumb));
}

function getTagSetFromItemOnFavoritesPage(item: HTMLElement | Favorite): Set<string> {
  const favorite = getFavorite(item.id);
  return favorite === undefined ? new Set() : new Set(favorite.tags);
}

export const getTagSetFromItem: (item: HTMLElement | Favorite) => Set<string> = ON_FAVORITES_PAGE ? getTagSetFromItemOnFavoritesPage : getTagSetFromItemOnSearchPage;

export function getContentTypeFromThumb(thumb: HTMLElement): ContentType {
  return getContentType(getTagSetFromItem(thumb));
}

export function moveTagsFromTitleToTagsAttribute(thumb: HTMLElement): void {
  const image = getImageFromThumb(thumb);

  if (image === null || !image.hasAttribute("title")) {
    return;
  }
  image.setAttribute("tags", image.title);
  image.removeAttribute("title");
}
