import { getIdFromThumb, getImageFromThumb } from "../../../utils/dom/dom";
import { FavoritesDatabaseRecord } from "../../../types/favorite_data_types";
import { Post } from "../../../types/common_types";
import { createEmptyPost } from "../../../lib/server/parse/api_post_parser";
import { decompressPreviewSource } from "../../../lib/server/url/media_url_transformer";
import { removeExtraWhiteSpace } from "../../../utils/string/format";

export function createPostFromRawFavorite(object: HTMLElement | FavoritesDatabaseRecord): Post {
  if (object instanceof HTMLElement) {
    return createPostFromFavoritesPageThumb(object);
  }
  return createPostFromDatabaseRecord(object);
}

export function clearPost(post: Post): void {
  post.id = "";
  post.height = 0;
  post.score = 0;
  post.fileURL = "";
  post.parentId = "";
  post.sampleURL = "";
  post.sampleWidth = 0;
  post.sampleHeight = 0;
  post.previewURL = "";
  post.rating = "";
  post.tags = "";
  post.width = 0;
  post.change = 0;
  post.md5 = "";
  post.creatorId = "";
  post.hasChildren = false;
  post.createdAt = "";
  post.status = "";
  post.source = "";
  post.hasNotes = false;
  post.hasComments = false;
  post.previewWidth = 0;
  post.previewHeight = 0;
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
  post.tags = preprocessTags(image, post.id);
  return post;
}

function preprocessTags(image: HTMLElement, id: string): string {
  if (image === null) {
    return "";
  }
  const tags = image.title || image.getAttribute("tags") || "";
  const tagsWithIdAdded = `${tags} ${id}`;
  return removeExtraWhiteSpace(tagsWithIdAdded).split(" ").sort().join(" ");
}
