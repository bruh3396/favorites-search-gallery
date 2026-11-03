import { TagCategory, TagCategoryMap } from "@/types/search";
import { MediaExtension } from "@/types/media";

export type ServerPost = {
  id: string;
  width: number;
  height: number;
  score: number;
  rating: string;
  changedAt: number;
  directory: number;
  stem: string;
  extension: string;
  tagCategoryByName: Record<string, TagCategory>;
};

export type Post = {
  id: string;
  width: number;
  height: number;
  score: number;
  rating: string;
  change: number;
  fileURL: string;
  previewURL: string;
  tags: string;
  duration?: number;
  deleted?: boolean;
  extension?: MediaExtension;
  fetchedAt?: number;
};

export type ParsedPost = {
  post: Post;
  tagCategories: TagCategoryMap;
};

export type PostResponse =
  | { status: "ok"; post: ServerPost }
  | { status: "deleted" }
  | { status: "retry" };

export type TagResponse =
  | { status: "ok"; category: TagCategory }
  | { status: "not_found" }
  | { status: "retry" };

export type Route = "ping" | "posts" | "tags";
