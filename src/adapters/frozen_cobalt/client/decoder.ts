import { FrozenCobaltPost, FrozenCobaltTagCategoryCode } from "@/adapters/frozen_cobalt/client/schema";
import { TagCategory, TagCategoryMap } from "@/core/domain/tag/tag";
import { CategorizedPost, Rating } from "@/core/domain/post/post";
import { FrozenCobaltError } from "@/adapters/frozen_cobalt/client/error";
import { Media } from "@/core/domain/media/media";
import { decodeHtmlEntities } from "@/core/utils/string/string";

const TAG_CATEGORY_BY_CODE: Record<NonNullable<FrozenCobaltTagCategoryCode>, TagCategory> = {
  0: "general",
  1: "artist",
  2: "unknown",
  3: "copyright",
  4: "character",
  5: "metadata"
};
const RATING_BY_INITIAL: Partial<Record<string, Rating>> = { e: "explicit", q: "questionable", s: "safe" };

export type FrozenCobaltMintMedia = (file: { url: string; tags: string }) => Media | null;

export function decodePost(post: FrozenCobaltPost, mintMedia: FrozenCobaltMintMedia): CategorizedPost {
  const tagCategories = decodeTagCategories(post);
  const tags = [...tagCategories.keys()].join(" ");
  const media = mintMedia({ url: post.fileURL, tags });

  if (media === null) {
    throw new FrozenCobaltError("unknown_file", { subject: post.fileURL });
  }
  return {
    post: {
      id: post.id,
      width: post.width,
      height: post.height,
      score: post.score,
      rating: decodeRating(post.rating),
      changedAt: post.change * 1_000,
      media,
      tags,
      deleted: false
    },
    tagCategories
  };
}

export function decodeTagCategory(code: FrozenCobaltTagCategoryCode): TagCategory {
  return code === null ? "general" : TAG_CATEGORY_BY_CODE[code];
}

function decodeRating(rating: string): Rating {
  return RATING_BY_INITIAL[rating.charAt(0).toLowerCase()] ?? "explicit";
}

function decodeTagCategories(post: FrozenCobaltPost): TagCategoryMap {
  const entries = Object.entries(post.tagCategories);
  return new Map(entries.map(([tagName, code]) => [decodeHtmlEntities(tagName), decodeTagCategory(code)]));
}
