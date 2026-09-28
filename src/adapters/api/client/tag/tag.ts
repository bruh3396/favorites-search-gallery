import { BatchedRequests } from "@/adapters/api/client/batch";
import { EncodedTagCategory } from "@/types/search";
import { Route } from "@/adapters/api/client/server";

const RATE_LIMIT = { concurrency: 4, ratePerSecond: 10 };

export type TagResponse =
  | { status: "ok"; category: EncodedTagCategory }
  | { status: "rate_limited" };

export function createTagRequests(send: (route: Route, body: Record<string, unknown>) => Promise<Record<string, TagResponse>>): BatchedRequests<TagResponse> {
  return new BatchedRequests(RATE_LIMIT, tagNames => send("tag", { tagNames }));
}
