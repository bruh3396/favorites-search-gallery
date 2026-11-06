import { ALL_POST_STATUSES_MASK, isPostStatusMask } from "@/core/domain/post/post_status_mask";
import { ALL_RATINGS_MASK, isRatingMask } from "@/core/domain/post/rating_mask";
import { FAVORITES_SORT_KEYS, FavoritesSortKey } from "@/core/features/favorites/search/favorites_sort_key";
import { FieldGuards, createOneOfGuard, createSameKindGuard } from "@/core/utils/guard/guard";
import { isBoolean } from "@/core/utils/guard/unknown_utilities";

export interface FavoritesSearchSettings {
  readonly query: string;
  readonly isInverted: boolean;
  readonly sortKey: FavoritesSortKey;
  readonly isSortAscending: boolean;
  readonly allowedRatings: number;
  readonly allowedStatuses: number;
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
  allowedStatuses: ALL_POST_STATUSES_MASK,
  isBlacklistEnabled: false,
  isShuffled: false,
  shuffleSeed: 0
};

const FILTER_KEYS = ["query", "isInverted", "allowedRatings", "allowedStatuses", "isBlacklistEnabled"] as const;

export function isFilteringFavoritesSearchSettings(favoritesSearchSettings: FavoritesSearchSettings): boolean {
  return FILTER_KEYS.some(key => favoritesSearchSettings[key] !== DEFAULT_FAVORITES_SEARCH_SETTINGS[key]);
}

export function countChangedFavoritesSearchSettings(favoritesSearchSettings: FavoritesSearchSettings): number {
  const { isInverted, sortKey, isSortAscending, allowedRatings, allowedStatuses, isBlacklistEnabled, isShuffled } = DEFAULT_FAVORITES_SEARCH_SETTINGS;
  return [
    favoritesSearchSettings.sortKey !== sortKey || favoritesSearchSettings.isSortAscending !== isSortAscending,
    favoritesSearchSettings.isShuffled !== isShuffled,
    favoritesSearchSettings.isInverted !== isInverted,
    favoritesSearchSettings.isBlacklistEnabled !== isBlacklistEnabled,
    favoritesSearchSettings.allowedStatuses !== allowedStatuses,
    favoritesSearchSettings.allowedRatings !== allowedRatings
  ].filter(Boolean).length;
}

export const FAVORITES_SEARCH_SETTINGS_GUARDS: FieldGuards<FavoritesSearchSettings> = {
  query: createSameKindGuard(""),
  isInverted: isBoolean,
  sortKey: createOneOfGuard(FAVORITES_SORT_KEYS),
  isSortAscending: isBoolean,
  allowedRatings: isRatingMask,
  allowedStatuses: isPostStatusMask,
  isBlacklistEnabled: isBoolean,
  isShuffled: isBoolean,
  shuffleSeed: isSeed
};
