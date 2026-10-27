import { removeExtraWhitespace, removeNonNumericCharacters } from "@/core/utils/string/string_utilities";
import { NO_MEDIA } from "@/core/domain/media/media";
import { Post } from "@/core/domain/post/post";
import { MediaMinter } from "@/core/domain/media/media_minter";

export function parseRule34Thumb(thumb: HTMLElement, mintMedia: MediaMinter): Post | null {
  const id = parseId(thumb);

  if (id === "") {
    return null;
  }
  const image = thumb.querySelector("img");
  const tags = normalizeTags(image?.title ?? "");
  return {
    id,
    tags,
    width: 0,
    height: 0,
    score: 0,
    rating: "explicit",
    changedAt: 0,
    durationSeconds: 0,
    status: "active",
    media: mintMedia({ url: parsePreviewUrl(image), tags }) ?? NO_MEDIA
  };
}

function parseId(thumb: HTMLElement): string {
  return removeNonNumericCharacters(thumb.id || (thumb.querySelector("a")?.id ?? ""));
}

function normalizeTags(tags: string): string {
  return removeExtraWhitespace(tags.replace(/\bvide\b/g, "video"));
}

function parsePreviewUrl(image: HTMLImageElement | null): string {
  if (image === null) {
    return "";
  }
  return image.src === "" ? image.getAttribute("data-cfsrc") ?? "" : image.src;
}
