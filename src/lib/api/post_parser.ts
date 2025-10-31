/* eslint-disable max-classes-per-file */
import { Post } from "../../types/common_types";
import { createEmptyPost } from "../../features/favorites/types/favorite/favorite_type_utils";

export class ApiParseError extends Error { }
export class DeletedPostError extends Error { }

const PARSER = new DOMParser();

function parseNumber(attribute: string, post: Element): number {
  return Number(post.getAttribute(attribute) ?? 0);
}

function parseString(attribute: string, post: Element): string {
  return String(post.getAttribute(attribute) ?? "");
}

function parseBoolean(attribute: string, post: Element): boolean {
  return post.getAttribute(attribute) === "true";
}

function createPostFromAPIElement(element: Element): Post {
  return {
    id: parseString("id", element),
    height: parseNumber("height", element),
    score: parseNumber("score", element),
    fileURL: parseString("file_url", element),
    parentId: parseString("parent_id", element),
    sampleURL: parseString("sample_url", element),
    sampleWidth: parseNumber("sample_width", element),
    sampleHeight: parseNumber("sample_height", element),
    previewURL: parseString("preview_url", element),
    rating: parseString("rating", element),
    tags: parseString("tags", element),
    width: parseNumber("width", element),
    change: parseNumber("change", element),
    md5: parseString("md5", element),
    creatorId: parseString("creator_id", element),
    hasChildren: parseBoolean("has_children", element),
    createdAt: parseString("created_at", element),
    status: parseString("status", element),
    source: parseString("source", element),
    hasNotes: parseBoolean("has_notes", element),
    hasComments: parseBoolean("has_comments", element),
    previewWidth: parseNumber("preview_width", element),
    previewHeight: parseNumber("preview_height", element)
  };
}

export function extractPostFromAPI(html: string): Post {
  const post = PARSER.parseFromString(html, "text/html").querySelector("post");

  if (post === null) {
    throw new ApiParseError();
  }
  return createPostFromAPIElement(post);
}

export function extractPostFromAPISafe(html: string): Post {
  try {
    return extractPostFromAPI(html);
  } catch {
    return createEmptyPost();
  }
}
