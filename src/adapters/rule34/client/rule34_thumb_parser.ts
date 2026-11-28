import { removeExtraWhitespace, removeNonNumericCharacters } from "@/core/utils/string/string_utilities";
import { MediaMinter } from "@/core/domain/media/media_minter";
import { NO_MEDIA } from "@/core/domain/media/media";
import { Post } from "@/core/domain/post/post";

export function parseRule34Thumb(thumb: HTMLElement, mintMedia: MediaMinter): Post | null {
  const postId = parsePostId(thumb);

  if (postId === "") {
    return null;
  }
  const image = thumb.querySelector("img");
  const tags = normalizeTags(image?.title ?? "");
  return {
    id: postId,
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

function parsePostId(thumb: HTMLElement): string {
  return removeNonNumericCharacters(thumb.id || (thumb.querySelector("a")?.id ?? ""));
}

const FIRST_TAG_FIXES: ReadonlyMap<string, string> = new Map([
  ["boy", "1boy"], ["girls", "1girls"], ["girl", "1girl"], ["boys", "2boys"],
  ["animal", "1animal"], ["animals", "2animals"], ["monsters", "2monsters"],
  ["d", "3d"], ["d_(artwork)", "3d_(artwork)"],
  ["0_seconds", "10_seconds"], ["0s", "10s"], ["000", "2000"],
  [":1", "1:1"], [":3", "4:3"], ["..", "..."], ["lush", "blush"]
]);
const LAST_TAG_FIXES: ReadonlyMap<string, string> = new Map([
  ["vide", "video"], ["video_game", "video_games"], ["web", "webm"],
  ["wide_hip", "wide_hips"], ["wide_eye", "wide_eyed"], ["yellow_eye", "yellow_eyes"],
  ["white_eye", "white_eyes"], ["white_glove", "white_gloves"],
  ["thigh", "thighs"], ["thick_thigh", "thick_thighs"], ["thighhigh", "thighhighs"],
  ["stocking", "stockings"], ["wrist_cuff", "wrist_cuffs"], ["toe", "toes"],
  ["wing", "wings"], ["tatto", "tattoo"], ["vei", "veil"], ["whi", "whip"],
  ["tau", "taur"], ["we", "wet"], ["sol", "solo"], ["win", "wink"], ["yo", "you"],
  ["witche", "witches"], ["vine", "vines"], ["wood", "woods"]
]);
const UNOPENED_QUALIFIER = /^[a-z0-9][^()]*\)$/i;
const UNCLOSED_QUALIFIER = /_\([^()]+$/;

function normalizeTags(title: string): string {
  const tags = removeExtraWhitespace(title).split(" ");
  const lastIndex = tags.length - 1;
  return tags.map((tag, index) => {
    if (index === 0) {
      return repairFirstTag(tag);
    }
    return index === lastIndex ? repairLastTag(tag) : tag;
  }).join(" ");
}

function repairFirstTag(tag: string): string {
  return FIRST_TAG_FIXES.get(tag) ?? (UNOPENED_QUALIFIER.test(tag) ? `(${tag}` : tag);
}

function repairLastTag(tag: string): string {
  return LAST_TAG_FIXES.get(tag) ?? (UNCLOSED_QUALIFIER.test(tag) ? `${tag})` : tag);
}

function parsePreviewUrl(image: HTMLImageElement | null): string {
  if (image === null) {
    return "";
  }
  return image.src === "" ? image.getAttribute("data-cfsrc") ?? "" : image.src;
}
