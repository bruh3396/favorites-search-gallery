import { getImageFromThumb, parseIdFromThumb } from "@/lib/thumb/thumbs";
import { Post } from "@/types/api";
import { SerializedFavorite } from "@/types/favorite";
import { chain } from "@/utils/function";
import { decompressPreviewSource } from "@/lib/media/url_compressor";
import { getTagsFromThumb } from "@/lib/thumb/tag";
import { removeExtraWhiteSpace } from "@/utils/string/format";

export function createPost(source: HTMLElement | SerializedFavorite): Post {
  return source instanceof HTMLElement ? createPostFromThumb(source) : createPostFromRecord(source);
}

export function clearPost(post: Post): void {
  Object.assign(post, createEmptyPost());
}

function createPostFromThumb(thumb: HTMLElement): Post {
  const post = createEmptyPost(parseIdFromThumb(thumb));
  const image = getImageFromThumb(thumb);

  if (image === null) {
    return post;
  }
  post.previewURL = image.src ?? image.getAttribute("data-cfsrc") ?? "";
  post.tags = normalizeTags(thumb, post.id);
  return post;
}

function createPostFromRecord(record: SerializedFavorite): Post {
  const post = createEmptyPost(record.id);

  post.height = record.metadata.height;
  post.width = record.metadata.width;
  post.previewURL = decompressPreviewSource(record.src);
  return post;
}

const EMPTY_TAG_CATEGORIES: Post["tagCategories"] = new Map();

function createEmptyPost(id: string = ""): Post {
  return {
    id,
    width: 0,
    height: 0,
    score: 0,
    rating: "",
    change: 0,
    tags: "",
    fileURL: "",
    previewURL: "",
    tagCategories: EMPTY_TAG_CATEGORIES
  };
}

function normalizeTags(thumb: HTMLElement, id: string): string {
  return chain(
    getTagsFromThumb(thumb),
    fixTruncatedVideoTag,
    tags => appendId(tags, id),
    sortTags,
    removeExtraWhiteSpace
  );
}

const appendId = (tags: string, id: string): string => `${tags} ${id}`;
const fixTruncatedVideoTag = (tags: string): string => tags.replace(/\bvide\b/g, "video");
const sortTags = (tags: string): string => tags.split(" ").sort().join(" ");
