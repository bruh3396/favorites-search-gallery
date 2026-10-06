import { METRICS, Rating } from "@/core/domain/post/post";

export const SORT_KEYS = ["favorited", "random", ...METRICS] as const;

export type SortKey = (typeof SORT_KEYS)[number];

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
