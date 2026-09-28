import { EncodedTagCategory, EncodedTagCategoryMap } from "@/types/search";

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

export type PostResponse =
  | { status: "ok"; post: ServerPost }
  | { status: "rate_limited"; id: string }
  | { status: "error"; id: string }
  | { status: "deleted"; id: string }
  | { status: "deferred"; id: string };

export type TagResponse =
  | { status: "ok"; category: EncodedTagCategory }
  | { status: "rate_limited" };
