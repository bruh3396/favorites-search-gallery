import { CategorizedPost, PostResponse } from "@/types/api";
import { DeletedPostError, RateLimitedError } from "@/types/errors";
import { TagCategoryMap } from "@/types/search";
import { decodeTagCategory } from "@/lib/remote/parsers/api_tag_parser";

export function parsePostResponse(response: PostResponse): CategorizedPost {
  if (response.status === "deleted") {
    throw new DeletedPostError();
  }

  if (response.status === "rate_limited") {
    throw new RateLimitedError();
  }
  const compact = response.post;
  const tagNames = Object.keys(compact.tags).sort();
  const tagCategories: TagCategoryMap = new Map();

  for (const tagName of tagNames) {
    tagCategories.set(tagName, decodeTagCategory(compact.tags[tagName]));
  }
  return {
    id: String(compact.id),
    width: compact.width,
    height: compact.height,
    score: compact.score,
    rating: compact.rating,
    change: compact.change,
    createdAt: compact.createdAt,
    tags: tagNames.join(" "),
    tagCategories,
    fileURL: compact.fileURL,
    previewURL: compact.previewURL,
    parentId: "",
    sampleURL: "",
    sampleWidth: 0,
    sampleHeight: 0,
    md5: "",
    creatorId: "",
    hasChildren: false,
    status: "",
    source: "",
    hasNotes: false,
    hasComments: false,
    previewWidth: 0,
    previewHeight: 0
  };
}
