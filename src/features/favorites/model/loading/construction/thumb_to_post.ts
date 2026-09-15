import { Post } from "@/types/api";
import { getImageFromThumb } from "@/lib/ui/thumb/query";
import { getTagsFromThumb } from "@/lib/ui/thumb/tag";
import { parseIdFromThumb } from "@/lib/ui/thumb/post_id";
import { removeExtraWhitespace } from "@/utils/pure/string";

export function thumbToPost(thumb: HTMLElement): Post {
  const id = parseIdFromThumb(thumb);
  const image = getImageFromThumb(thumb);
  const previewURL = (image?.src ?? image?.getAttribute("data-cfsrc") ?? "");
  return {
    id,
    tags: image === null ? "" : normalizeTags(thumb),
    width: 0,
    height: 0,
    score: 0,
    rating: "",
    change: 0,
    fileURL: "",
    duration: 0,
    deleted: false,
    previewURL
  };
}

function normalizeTags(thumb: HTMLElement): string {
  return removeExtraWhitespace(getTagsFromThumb(thumb).replace(/\bvide\b/g, "video"));
}
