import { Favorite } from "@/types/favorite";
import { ON_FAVORITES_PAGE } from "@/lib/environment";
import { convertToTagSet } from "@/utils/string/tags";
import { getImageFromThumb } from "@/lib/thumb/thumbs";

let getFavoriteTags: (id: string) => Set<string> | undefined = () => undefined;

export function setFavoriteTagsLookup(fn: (id: string) => Set<string> | undefined): void {
  getFavoriteTags = fn;
}

export const getTagSetFromItem: (item: HTMLElement | Favorite) => Set<string> = ON_FAVORITES_PAGE ? getTagSetFromFavoritesPageItem : getTagSetFromSearchPageItem;

function getTagSetFromFavoritesPageItem(item: HTMLElement | Favorite): Set<string> {
  const tags = getFavoriteTags(item.id);
  return tags === undefined ? new Set() : new Set(tags);
}

function getTagSetFromSearchPageItem(thumb: HTMLElement | Favorite): Set<string> {
  return convertToTagSet(getRawTagsFromSearchPageItem(thumb));
}

function getRawTagsFromSearchPageItem(thumb: HTMLElement | Favorite): string {
  if (!(thumb instanceof HTMLElement)) {
    return "";
  }
  const image = getImageFromThumb(thumb);

  if (image === null) {
    return "";
  }
  const tagAttribute = resolveTagAttribute(image);
  return image.getAttribute(tagAttribute) || "";
}

function resolveTagAttribute(image: HTMLImageElement): string {
  return image.hasAttribute("tags") ? "tags" : "title";
}
