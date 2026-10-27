import { CategorizedPost } from "@/core/domain/post/categorized_post";
import { Rating } from "@/core/domain/post/rating";
import { FrozenCobaltPost } from "@/adapters/frozen_cobalt/wire/frozen_cobalt_post";
import { FrozenCobaltTagCategoryCode } from "@/adapters/frozen_cobalt/wire/frozen_cobalt_tag_category_code";
import { TagCategory, TagCategoryMap } from "@/core/domain/tag_category/tag_category";
import { FrozenCobaltError } from "@/adapters/frozen_cobalt/client/frozen_cobalt_error";
import { MediaMinter } from "@/core/domain/media/media_minter";
import { decodeHtmlEntities } from "@/core/utils/string/string_utilities";

const TAG_CATEGORY_BY_CODE: Record<NonNullable<FrozenCobaltTagCategoryCode>, TagCategory> = {
  0: "general",
  1: "artist",
  2: "unknown",
  3: "copyright",
  4: "character",
  5: "metadata"
};
const RATING_BY_INITIAL: Partial<Record<string, Rating>> = { e: "explicit", q: "questionable", s: "safe" };

export function decodeFrozenCobaltPost(post: FrozenCobaltPost, mintMedia: MediaMinter): CategorizedPost {
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
      status: "active"
    },
    tagCategories
  };
}

export function decodeFrozenCobaltTagCategory(code: FrozenCobaltTagCategoryCode): TagCategory {
  return code === null ? "general" : TAG_CATEGORY_BY_CODE[code];
}

function decodeRating(rating: string): Rating {
  return RATING_BY_INITIAL[rating.charAt(0).toLowerCase()] ?? "explicit";
}

function decodeTagCategories(post: FrozenCobaltPost): TagCategoryMap {
  const entries = Object.entries(post.tagCategories);
  return new Map(entries.map(([tagName, code]) => [decodeHtmlEntities(tagName), decodeFrozenCobaltTagCategory(code)]));
}
