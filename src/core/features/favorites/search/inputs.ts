import { METRICS } from "@/core/domain/post/post";
import { SearchExpression } from "@/core/search/expressions/search_expression";

export const SORT_KEYS = ["favorited", "random", ...METRICS] as const;

export type SortKey = (typeof SORT_KEYS)[number];

export interface SearchSettings {
  readonly query: string;
  readonly isInverted: boolean;
  readonly sortKey: SortKey;
  readonly isSortAscending: boolean;
  readonly allowedRatings: number;
  readonly isBlacklistEnabled: boolean;
  readonly isShuffled: boolean;
  readonly shuffleSeed: number;
}

export interface SearchRequest {
  readonly expression: SearchExpression | undefined;
  readonly sortKey: SortKey;
  readonly isSortAscending: boolean;
  readonly allowedRatings: number;
  readonly isShuffled: boolean;
  readonly shuffleSeed: number;
}
