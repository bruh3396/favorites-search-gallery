import { getIdFromThumb, getImageFromThumb } from "../../../../utils/dom/dom";
import { FavoritesDatabaseRecord } from "../../../../types/primitives/composites";
import { Post } from "../../../../types/api/post";
import { decompressThumbSource } from "../../../../utils/image/image";
import { removeExtraWhiteSpace } from "../../../../utils/primitive/string";

export function createEmptyPost(): Post {
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

export function createPostFromRawFavorite(object: HTMLElement | FavoritesDatabaseRecord): Post {
  // this.id = "";
  // this.tags = "";
  // this.src = "";
  // this.metadataRecord = null;
  // this.createdFromDatabaseRecord = false;
  // this.cleared = false;

  if (object instanceof HTMLElement) {
    return createPostFromFavoritesPageThumb(object);
  }
  return createPostFromDatabaseRecord(object);
  // createdFromDatabaseRecord = true;
}

function createPostFromDatabaseRecord(record: FavoritesDatabaseRecord): Post {
  // this.id = record.id;
  // this.tags = record.tags;
  // this.src = ImageUtils.decompressThumbnailSource(record.src, record.id);
  // this.metadataRecord = record.metadata === undefined ? null : JSON.parse(record.metadata);
  const post = createEmptyPost();

  post.id = record.id;
  post.tags = "";
  post.previewURL = decompressThumbSource(record.src);
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
