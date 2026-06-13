import { ON_FAVORITES_PAGE } from "@/lib/environment";
import { getImageFromThumb } from "@/lib/thumb/thumbs";
import { toTagSet } from "@/utils/string/tags";

let getFavoriteTags: (id: string) => Set<string> | undefined = () => undefined;

export function setFavoriteTagsLookup(fn: (id: string) => Set<string> | undefined): void {
  getFavoriteTags = fn;
}

export function getTagsFromThumb(thumb: HTMLElement): string {
    const image = getImageFromThumb(thumb);
    return image?.title ?? image?.getAttribute("tags") ?? "";
}

export const getTagSetFromThumb: (thumb: HTMLElement) => Set<string> = ON_FAVORITES_PAGE ? getTagSetFromFavoritesPageThumb : getTagSetFromPostListThumb;

function getTagSetFromFavoritesPageThumb(thumb: HTMLElement): Set<string> {
  const tags = getFavoriteTags(thumb.id);
  return tags === undefined ? new Set() : new Set(tags);
}

function getTagSetFromPostListThumb(thumb: HTMLElement): Set<string> {
  return toTagSet(getRawTagsFromPostListThumb(thumb));
}

function getRawTagsFromPostListThumb(thumb: HTMLElement): string {
  const image = getImageFromThumb(thumb);

  if (image === null) {
    return "";
  }
  const tagAttribute = resolveTagAttribute(image);
  return image.getAttribute(tagAttribute) ?? "";
}

function resolveTagAttribute(image: HTMLImageElement): string {
  return image.hasAttribute("tags") ? "tags" : "title";
}
