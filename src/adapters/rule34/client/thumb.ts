import { removeExtraWhitespace, removeNonNumericCharacters } from "@/core/utils/string/string";
import { Media } from "@/core/domain/media/media";
import { Post } from "@/core/domain/post/post";
import { Rule34MintMedia } from "@/adapters/rule34/client/mint_media";

const NO_MEDIA: Media = { kind: "image", locator: "" };

export function parseThumb(thumb: HTMLElement, mintMedia: Rule34MintMedia): Post | null {
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
    deleted: false,
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
