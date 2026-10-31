import { CategorizedPost } from "@/core/domain/post/categorized_post";
import { FrozenCobaltPost } from "@/adapters/frozen_cobalt/wire/frozen_cobalt_post";
import { FrozenCobaltMediaMinter } from "@/adapters/frozen_cobalt/client/frozen_cobalt_media_minter";

export function decodeFrozenCobaltPost(post: FrozenCobaltPost, mintMedia: FrozenCobaltMediaMinter): CategorizedPost {
  const tagCategories = new Map(Object.entries(post.tagCategoryByName));
  const tags = [...tagCategories.keys()].join(" ");
  return {
    post: {
      id: post.id,
      width: post.width,
      height: post.height,
      score: post.score,
      rating: post.rating,
      changedAt: post.changedAt * 1_000,
      media: mintMedia({ directory: post.directory, stem: post.stem, extension: post.extension, tags }),
      tags,
      status: "active"
    },
    tagCategories
  };
}
