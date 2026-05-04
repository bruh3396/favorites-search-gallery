import { ApiParseError, DeletedPostError } from "../../../types/errors";
import { Post, PostResponse } from "../../../types/api";

export function postResponseToPost(response: PostResponse): Post {
  if (response.status === "deleted") {
    throw new DeletedPostError();
  }

  if (response.status === "rate_limited") {
    throw new ApiParseError();
  }
  return {
    ...createEmptyPost(),
    id: response.post.id,
    width: response.post.width,
    height: response.post.height,
    score: response.post.score,
    rating: response.post.rating,
    change: response.post.change,
    createdAt: response.post.createdAt,
    tags: response.post.tags,
    fileURL: response.post.fileURL,
    previewURL: response.post.previewURL
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
