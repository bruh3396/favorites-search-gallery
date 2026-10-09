import { METRICS } from "@/core/domain/post/post";
import { SearchExpression } from "@/core/search/expressions/search_expression";

export const SORT_KEYS = ["favorited", "random", ...METRICS] as const;

export type SortKey = (typeof SORT_KEYS)[number];

export interface SearchSettings {
  query: string;
  isInverted: boolean;
  sortKey: SortKey;
  isSortAscending: boolean;
  allowedRatings: number;
  isBlacklistEnabled: boolean;
  isShuffled: boolean;
  shuffleSeed: number;
}

export interface SearchRequest {
  expression: SearchExpression | undefined;
  sortKey: SortKey;
  isSortAscending: boolean;
  allowedRatings: number;
  isShuffled: boolean;
  shuffleSeed: number;
}
