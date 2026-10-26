import { ALL_RATINGS_MASK, isRatingMask } from "@/core/domain/post/rating_mask";
import { METRICS } from "@/core/domain/post/metric";
import { isBoolean, oneOf, sameKindAs, FieldGuards } from "@/core/utils/guard/guard";
import { SearchExpression } from "@/core/domain/search/expressions/search_expression";

export const FAVORITES_SORT_KEYS = ["favorited", "random", ...METRICS] as const;

export type FavoritesSortKey = (typeof FAVORITES_SORT_KEYS)[number];

export interface FavoritesSearchSettings {
  readonly query: string;
  readonly isInverted: boolean;
  readonly sortKey: FavoritesSortKey;
  readonly isSortAscending: boolean;
  readonly allowedRatings: number;
  readonly isBlacklistEnabled: boolean;
  readonly isShuffled: boolean;
  readonly shuffleSeed: number;
}

export interface FavoritesSearchRequest {
  readonly expression: SearchExpression | undefined;
  readonly sortKey: FavoritesSortKey;
  readonly isSortAscending: boolean;
  readonly allowedRatings: number;
  readonly isShuffled: boolean;
  readonly shuffleSeed: number;
}

function isSeed(stored: unknown): stored is number {
  return Number.isInteger(stored) && (stored as number) >= 0;
}

export const DEFAULT_FAVORITES_SEARCH_SETTINGS: FavoritesSearchSettings = {
  query: "",
  isInverted: false,
  sortKey: "favorited",
  isSortAscending: false,
  allowedRatings: ALL_RATINGS_MASK,
  isBlacklistEnabled: false,
  isShuffled: false,
  shuffleSeed: 0
};

const FILTER_KEYS = ["query", "isInverted", "allowedRatings", "isBlacklistEnabled"] as const;

export const UNFILTERED_FAVORITES_SEARCH_SETTINGS: Pick<FavoritesSearchSettings, (typeof FILTER_KEYS)[number]> = {
  query: DEFAULT_FAVORITES_SEARCH_SETTINGS.query,
  isInverted: DEFAULT_FAVORITES_SEARCH_SETTINGS.isInverted,
  allowedRatings: DEFAULT_FAVORITES_SEARCH_SETTINGS.allowedRatings,
  isBlacklistEnabled: DEFAULT_FAVORITES_SEARCH_SETTINGS.isBlacklistEnabled
};

export function isFiltered(settings: FavoritesSearchSettings): boolean {
  return FILTER_KEYS.some(key => settings[key] !== UNFILTERED_FAVORITES_SEARCH_SETTINGS[key]);
}

export const FAVORITES_SEARCH_SETTINGS_GUARDS: FieldGuards<FavoritesSearchSettings> = {
  query: sameKindAs(""),
  isInverted: isBoolean,
  sortKey: oneOf(FAVORITES_SORT_KEYS),
  isSortAscending: isBoolean,
  allowedRatings: isRatingMask,
  isBlacklistEnabled: isBoolean,
  isShuffled: isBoolean,
  shuffleSeed: isSeed
};
