import { getIdFromThumb, getImageFromThumb } from "@/lib/thumb/thumbs";
import { FavoritesDatabaseRecord } from "@/types/favorite";
import { Post } from "@/types/api";
import { decompressPreviewSource } from "@/lib/media/media_url_transformer";
import { removeExtraWhiteSpace } from "@/utils/string/format";

export function createPost(source: HTMLElement | FavoritesDatabaseRecord): Post {
  if (source instanceof HTMLElement) {
    return createPostFromFavoritesPageThumb(source);
  }
  return createPostFromDatabaseRecord(source);
}

export function clearPost(post: Post): void {
  Object.assign(post, createEmptyPost());
}

function createEmptyPost(): Post {
  return {
    id: "",
    height: 0,
    score: 0,
    fileURL: "",
    parentId: "",
    sampleURL: "",
    sampleWidth: 0,
    sampleHeight: 0,
    previewURL: "",
    rating: "",
    tags: "",
    width: 0,
    change: 0,
    md5: "",
    creatorId: "",
    hasChildren: false,
    createdAt: "",
    status: "",
    source: "",
    hasNotes: false,
    hasComments: false,
    previewWidth: 0,
    previewHeight: 0
  };
}

function normalizeTags(image: HTMLElement, id: string): string {
  const tags = image.title || image.getAttribute("tags") || "";
  return removeExtraWhiteSpace(`${tags} ${id}`).replace(/\bvide\b/g, "video").split(" ").sort().join(" ");
}

function createPostFromDatabaseRecord(record: FavoritesDatabaseRecord): Post {
  const post = createEmptyPost();

  post.id = record.id;
  post.height = record.metadata.height;
  post.width = record.metadata.width;
  post.previewURL = decompressPreviewSource(record.src);
  return post;
}

function createPostFromFavoritesPageThumb(element: HTMLElement): Post {
  const post = createEmptyPost();

  post.id = getIdFromThumb(element);
  const image = getImageFromThumb(element);

  if (image === null) {
    return post;
  }
  const source = image.src || image.getAttribute("data-cfsrc") || "";

  post.previewURL = source;
  post.tags = normalizeTags(image, post.id);
  return post;
}
