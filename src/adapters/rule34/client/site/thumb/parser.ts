import { Post } from "@/core/domain/post/post";
import { getImageFromThumb } from "@/lib/ui/thumb/query";
import { getTagsFromThumb } from "@/lib/ui/thumb/tag";
import { parseIdFromThumb } from "@/lib/ui/thumb/post_id";
import { removeExtraWhitespace } from "@/utils/pure/string";

export function parseThumb(thumb: HTMLElement): Post {
  return {
    id: parseIdFromThumb(thumb),
    tags: normalizeTags(thumb),
    width: 0,
    height: 0,
    score: 0,
    rating: "",
    change: 0,
    fileURL: "",
    duration: 0,
    deleted: false,
    previewURL: parsePreviewURL(getImageFromThumb(thumb))
  };
}

function normalizeTags(thumb: HTMLElement): string {
  return removeExtraWhitespace(getTagsFromThumb(thumb).replace(/\bvide\b/g, "video"));
}

function parsePreviewURL(image: HTMLImageElement | null): string {
  if (image === null) {
    return "";
  }
  return image.src === "" ? image.getAttribute("data-cfsrc") ?? "" : image.src;
}
