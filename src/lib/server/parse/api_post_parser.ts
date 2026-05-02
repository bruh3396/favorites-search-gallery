/* eslint-disable max-classes-per-file */
import { Post, SlimPost } from "../../../types/post";
export class ApiParseError extends Error { }
export class DeletedPostError extends Error { }

export function slimPostToPost(slim: SlimPost): Post {
  return {
    ...createEmptyPost(),
    id: slim.id,
    width: slim.width,
    height: slim.height,
    score: slim.score,
    rating: slim.rating,
    change: slim.change,
    createdAt: slim.createdAt,
    tags: slim.tags,
    fileURL: slim.fileURL,
    previewURL: slim.previewURL
  };
}

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
