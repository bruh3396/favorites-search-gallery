import { Media } from "@/core/domain/media/media";
import { CategorizedPost } from "@/core/domain/post/post";
import { ServerPost } from "@/adapters/api/client/post/post";
import { TagCategoryMap } from "@/core/domain/tag/tag";
import { decodeHtmlEntities } from "@/utils/pure/string";
import { decodeTagCategory } from "@/lib/domain/tag/category_codec";

export function parsePost(post: ServerPost, media: Media): CategorizedPost {
  const { tagCategories: encodedTagCategories, fileURL: _fileURL, previewURL: _previewURL, ...rest } = post;
  const tagCategories: TagCategoryMap = new Map();

  for (const [tagName, encoded] of Object.entries(encodedTagCategories)) {
    tagCategories.set(decodeHtmlEntities(tagName), decodeTagCategory(encoded));
  }
  return { post: { ...rest, media, tags: [...tagCategories.keys()].join(" "), deleted: false, duration: 0 }, tagCategories };
}
