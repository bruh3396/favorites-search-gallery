import {Post} from "../types/api/post";

class ApiError extends Error { }

const API_BASE_URL = "https://api.rule34.xxx//index.php?page=dapi&s=";
const API_POST_URL = `${API_BASE_URL}post&q=index&id=`;
const API_TAG_URL = `${API_BASE_URL}tag&q=index&id=`;

const PARSER = new DOMParser();

function parseNumber(attribute: string, post: Element): number {
  return Number(post.getAttribute(attribute) || 0);
}

function parseString(attribute: string, post: Element): string {
  return String(post.getAttribute(attribute) || "");
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

async function fetchPost(id: string): Promise<Post> {
  const url = `${API_POST_URL}${id}`;
  const response = await fetch(url);
  const data = await response.text();
  const post = PARSER.parseFromString(data, "text/html").querySelector("post");

  if (post === null) {
    throw new ApiError(url);
  }
  return createPostFromAPIElement(post);
}

export const api = {
  fetchPost
};
