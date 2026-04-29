import { getIdFromThumb, getImageFromThumb } from "../../../lib/dom/thumb";
import { FavoritesDatabaseRecord } from "../../../types/favorite";
import { Post } from "../../../types/post";
import { createEmptyPost } from "../../../lib/server/parse/api_post_parser";
import { decompressPreviewSource } from "../../../lib/server/url/media_url_transformer";
import { removeExtraWhiteSpace } from "../../../utils/string/format";

function normalizeTags(image: HTMLElement, id: string): string {
  const tags = image.title || image.getAttribute("tags") || "";
  return removeExtraWhiteSpace(`${tags} ${id}`).split(" ").sort().join(" ");
}

export function createPost(object: HTMLElement | FavoritesDatabaseRecord): Post {
  if (object instanceof HTMLElement) {
    return createPostFromFavoritesPageThumb(object);
  }
  return createPostFromDatabaseRecord(object);
}

export function clearPost(post: Post): void {
  Object.assign(post, createEmptyPost());
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
