import { EncodedTagCategory, EncodedTagCategoryMap, TagCategoryMap } from "@/types/search";
import { MediaExtension } from "@/types/media";

export type ServerPost = {
  id: string;
  width: number;
  height: number;
  score: number;
  rating: string;
  change: number;
  fileURL: string;
  previewURL: string;
  tagCategories: EncodedTagCategoryMap;
};

export type Post = Omit<ServerPost, "tagCategories"> & {
  tags: string;
  duration?: number;
  extension?: MediaExtension;
  deleted?: boolean;
  fetchedAt?: number;
};

export type ParsedPost = {
  post: Post;
  tagCategories: TagCategoryMap;
};

export type PostResponse =
  | { status: "ok"; post: ServerPost }
  | { status: "rate_limited"; id: string }
  | { status: "error"; id: string }
  | { status: "deleted"; id: string }
  | { status: "deferred"; id: string };

export type TagResponse =
  | { status: "ok"; category: EncodedTagCategory }
  | { status: "rate_limited" };

export type Route = "ping" | "post" | "tag";
