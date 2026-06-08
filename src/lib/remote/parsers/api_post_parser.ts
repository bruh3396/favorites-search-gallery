import { DeletedPostError, PostFetchError } from "@/types/errors";
import { EncodedTagCategory, Post, PostResponse, RawPost, TagInfo } from "@/types/api";
import { TagCategoryMap } from "@/types/search";
import { decodeTagCategory, encodeTagCategory } from "@/lib/remote/parsers/api_tag_parser";
import { decodeHtmlEntities } from "@/utils/string/format";

export function parsePostResponse(response: PostResponse): Post {
  if (response.status === "rate_limited" || response.status === "error") {
    throw new PostFetchError();
  }
  const post = parseRawPost(response.raw);

  if (post === null) {
    throw new DeletedPostError();
  }
  return toPost(post);
}

function parseRawPost(raw: string): RawPost | null {
  let posts: RawPost[];

  try {
    posts = JSON.parse(raw) as RawPost[];
  } catch {
    return null;
  }

  if (!Array.isArray(posts) || posts.length === 0) {
    return null;
  }
  return posts[0];
}

function toTagCategories(tags: string, tagInfo: TagInfo[] | undefined): Record<string, EncodedTagCategory> {
  const categories: Record<string, EncodedTagCategory> = {};

  if (Array.isArray(tagInfo) && tagInfo.length > 0) {
    for (const info of tagInfo) {
      categories[decodeHtmlEntities(info.tag)] = encodeTagCategory(info.type);
    }
    return categories;
  }

  for (const tag of tags.split(" ")) {
    if (tag !== "") {
      categories[tag] = null;
    }
  }
  return categories;
}

function toPost(post: RawPost): Post {
  const tags = toTagCategories(post.tags, post.tag_info);
  const tagNames = Object.keys(tags).sort();
  const tagCategories: TagCategoryMap = new Map();

  for (const tagName of tagNames) {
    tagCategories.set(tagName, decodeTagCategory(tags[tagName]));
  }
  return {
    id: String(post.id),
    width: post.width,
    height: post.height,
    score: post.score,
    rating: post.rating,
    change: post.change,
    tags: tagNames.join(" "),
    fileURL: post.file_url,
    previewURL: post.preview_url,
    tagCategories
  };
}
