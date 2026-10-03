import { Media } from "@/core/domain/media/media";
import { Post } from "@/core/domain/post/post";
import { Rule34MintMedia } from "@/adapters/rule34/client/mint_media";
import { getImageFromThumb } from "@/lib/ui/thumb/query";
import { getTagsFromThumb } from "@/lib/ui/thumb/tag";
import { parseIdFromThumb } from "@/lib/ui/thumb/post_id";
import { removeExtraWhitespace } from "@/utils/pure/string";

const NO_MEDIA: Media = { kind: "image", locator: "" };

export function parseThumb(thumb: HTMLElement, mintMedia: Rule34MintMedia): Post {
  const tags = normalizeTags(thumb);
  return {
    id: parseIdFromThumb(thumb),
    tags,
    width: 0,
    height: 0,
    score: 0,
    rating: "",
    changedAt: 0,
    durationSeconds: 0,
    deleted: false,
    media: mintMedia({ url: parsePreviewUrl(getImageFromThumb(thumb)), tags }) ?? NO_MEDIA
  };
}

function normalizeTags(thumb: HTMLElement): string {
  return removeExtraWhitespace(getTagsFromThumb(thumb).replace(/\bvide\b/g, "video"));
}

function parsePreviewUrl(image: HTMLImageElement | null): string {
  if (image === null) {
    return "";
  }
  return image.src === "" ? image.getAttribute("data-cfsrc") ?? "" : image.src;
}
