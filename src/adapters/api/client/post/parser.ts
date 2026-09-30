import { CategorizedPost } from "@/core/domain/post/post";
import { Media } from "@/core/domain/media/media";
import { ServerPost } from "@/adapters/api/client/post/post";
import { TagCategoryMap } from "@/core/domain/tag/tag";
import { decodeHtmlEntities } from "@/utils/pure/string";
import { decodeTagCategory } from "@/adapters/api/client/tag/decoder";

export function parsePost(post: ServerPost, media: Media): CategorizedPost {
  const { tagCategories: encodedTagCategories, fileURL: _fileURL, previewURL: _previewURL, change, ...rest } = post;
  const tagCategories: TagCategoryMap = new Map();

  for (const [tagName, encoded] of Object.entries(encodedTagCategories)) {
    tagCategories.set(decodeHtmlEntities(tagName), decodeTagCategory(encoded));
  }
  return { post: { ...rest, media, tags: [...tagCategories.keys()].join(" "), changedAt: change * 1_000, deleted: false, durationSeconds: 0 }, tagCategories };
}
