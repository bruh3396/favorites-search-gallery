import { ALL_RATINGS_MASK, METRICS, isRatingMask } from "@/core/domain/post/post";
import { isBoolean, oneOf, sameKindAs } from "@/core/utils/guards/guards";
import { FieldGuards } from "@/core/utils/codec/codec";
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

function isSeed(stored: unknown): stored is number {
  return Number.isInteger(stored) && (stored as number) >= 0;
}

export const DEFAULT_SEARCH_SETTINGS: SearchSettings = {
  query: "",
  isInverted: false,
  sortKey: "favorited",
  isSortAscending: false,
  allowedRatings: ALL_RATINGS_MASK,
  isBlacklistEnabled: false,
  isShuffled: false,
  shuffleSeed: 0
};

export const SEARCH_SETTINGS_GUARDS: FieldGuards<SearchSettings> = {
  query: sameKindAs(""),
  isInverted: isBoolean,
  sortKey: oneOf(SORT_KEYS),
  isSortAscending: isBoolean,
  allowedRatings: isRatingMask,
  isBlacklistEnabled: isBoolean,
  isShuffled: isBoolean,
  shuffleSeed: isSeed
};
