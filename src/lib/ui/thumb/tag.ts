import { getImageFromThumb } from "@/lib/ui/thumb/query";
import { toSortedTagSet } from "@/utils/pure/tag";

let getFavoriteTags: (id: string) => Set<string> | undefined = () => undefined;
let resolveTagSetFromThumb: (thumb: HTMLElement) => Set<string> = getTagSetFromPostListThumb;

export function setFavoriteTagsLookup(lookup: (id: string) => Set<string> | undefined): void {
  getFavoriteTags = lookup;
  resolveTagSetFromThumb = getTagSetFromFavoritesPageThumb;
}

export function getTagsFromThumb(thumb: HTMLElement): string {
    const image = getImageFromThumb(thumb);
    return image?.title ?? image?.getAttribute("tags") ?? "";
}

export function getTagSetFromThumb(thumb: HTMLElement): Set<string> {
  return resolveTagSetFromThumb(thumb);
}

function getTagSetFromFavoritesPageThumb(thumb: HTMLElement): Set<string> {
  const tags = getFavoriteTags(thumb.id);
  return tags === undefined ? new Set() : new Set(tags);
}

function getTagSetFromPostListThumb(thumb: HTMLElement): Set<string> {
  return toSortedTagSet(getRawTagsFromPostListThumb(thumb));
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
