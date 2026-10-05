import { Metric, Rating } from "@/core/domain/post/post";

export type SortKey = "default" | "random" | Metric;

export interface SortOrder {
  key: SortKey;
  isAscending: boolean;
}

export interface SearchCriteria {
  query: string;
  sortOrder: SortOrder;
  allowedRatings: ReadonlySet<Rating>;
  excludesBlacklist: boolean;
}
