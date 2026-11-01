import { CategorizedPost } from "@/core/domain/post/categorized_post";
import { FrozenCobaltMediaMinter } from "@/adapters/frozen_cobalt/client/frozen_cobalt_media_minter";
import { FrozenCobaltPost } from "@/adapters/frozen_cobalt/wire/frozen_cobalt_post";

export function decodeFrozenCobaltPost(frozenCobaltPost: FrozenCobaltPost, mintMedia: FrozenCobaltMediaMinter): CategorizedPost {
  const tagCategories = new Map(Object.entries(frozenCobaltPost.tagCategoryByName));
  const tags = [...tagCategories.keys()].join(" ");
  return {
    post: {
      id: frozenCobaltPost.id,
      width: frozenCobaltPost.width,
      height: frozenCobaltPost.height,
      score: frozenCobaltPost.score,
      rating: frozenCobaltPost.rating,
      changedAt: frozenCobaltPost.changedAt * 1_000,
      media: mintMedia({ directory: frozenCobaltPost.directory, stem: frozenCobaltPost.stem, extension: frozenCobaltPost.extension, tags }),
      tags,
      status: "active"
    },
    tagCategories
  };
}
