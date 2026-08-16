import { EncodedTagCategory, EncodedTagCategoryMap, TagCategoryMap } from "@/types/search";

type BasePost<T> = {
  id: string;
  width: number;
  height: number;
  score: number;
  rating: string;
  change: number;
  fileURL: string;
  previewURL: string;
  tagCategories: T;
}

export type Post = BasePost<TagCategoryMap> & { tags: string }

export type ServerPost = BasePost<EncodedTagCategoryMap>

export type PostResponse =
  | { status: "ok"; post: ServerPost }
  | { status: "rate_limited"; id: string }
  | { status: "error"; id: string }
  | { status: "deleted"; id: string }
  | { status: "deferred"; id: string }

export type TagResponse =
  | { status: "ok"; category: EncodedTagCategory }
  | { status: "rate_limited" }

export type Route = "ping" | "post" | "tag"
