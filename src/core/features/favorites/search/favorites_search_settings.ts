import { ALL_RATINGS_MASK, isRatingMask } from "@/core/domain/post/rating_mask";
import { FAVORITES_SORT_KEYS, FavoritesSortKey } from "@/core/features/favorites/search/favorites_sort_key";
import { createOneOfGuard, createSameKindGuard, FieldGuards } from "@/core/utils/guard/guard";
import { isBoolean } from "@/core/utils/guard/unknown_utilities";

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

export function isFilteringFavoritesSearchSettings(favoritesSearchSettings: FavoritesSearchSettings): boolean {
  return FILTER_KEYS.some(key => favoritesSearchSettings[key] !== UNFILTERED_FAVORITES_SEARCH_SETTINGS[key]);
}

export const FAVORITES_SEARCH_SETTINGS_GUARDS: FieldGuards<FavoritesSearchSettings> = {
  query: createSameKindGuard(""),
  isInverted: isBoolean,
  sortKey: createOneOfGuard(FAVORITES_SORT_KEYS),
  isSortAscending: isBoolean,
  allowedRatings: isRatingMask,
  isBlacklistEnabled: isBoolean,
  isShuffled: isBoolean,
  shuffleSeed: isSeed
};
