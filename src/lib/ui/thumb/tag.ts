import { Favorite } from "@/types/favorite";
import { getImageFromThumb } from "@/lib/ui/thumb/query";
import { toSortedTagSet } from "@/core/domain/tag/tag";

export function getTagsFromThumb(thumb: HTMLElement): string {
    const image = getImageFromThumb(thumb);
    return image?.title ?? image?.getAttribute("tags") ?? "";
}

export function getTagSetFromThumb(thumb: HTMLElement, favoriteFor: (id: string) => Favorite | undefined): Set<string> {
  const favorite = favoriteFor(thumb.id);
  return favorite === undefined ? toSortedTagSet(getRawTagsFromPostListThumb(thumb)) : new Set(favorite.tags);
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
