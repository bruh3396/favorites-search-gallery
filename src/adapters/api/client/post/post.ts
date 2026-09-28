import { BatchedRequests } from "@/adapters/api/client/batch";
import { EncodedTagCategoryMap } from "@/types/search";
import { Route } from "@/adapters/api/client/server";

const RATE_LIMIT = { concurrency: 4, ratePerSecond: 2 };

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

export function createPostRequests(send: (route: Route, body: Record<string, unknown>) => Promise<Record<string, PostResponse>>): BatchedRequests<PostResponse> {
  return new BatchedRequests(RATE_LIMIT, ids => send("post", { ids }));
}
