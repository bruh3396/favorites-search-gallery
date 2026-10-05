import { Metric, Rating } from "@/core/domain/post/post";

export type SortKey = "favorited" | "random" | Metric;

export interface Sort {
  key: SortKey;
  isAscending: boolean;
}

export interface SearchCriteria {
  query: string;
  sort: Sort;
  allowedRatings: ReadonlySet<Rating>;
  blacklistQuery: string;
  shuffleSeed: number;
}
