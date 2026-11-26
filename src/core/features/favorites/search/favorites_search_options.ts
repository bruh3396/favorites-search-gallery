import { ALL_POST_STATUSES_MASK } from "@/core/domain/post/post_status_mask";
import { ALL_RATINGS_MASK } from "@/core/domain/post/rating_mask";
import { FavoritesSortKey } from "@/core/features/favorites/search/favorites_sort_key";

export interface FavoritesSearchOptions {
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

export const DEFAULT_FAVORITES_SEARCH_OPTIONS: FavoritesSearchOptions = {
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

const ORDER_KEYS = ["sortKey", "isSortAscending", "isShuffled"] as const;

const COUNTED_KEY_GROUPS: readonly (readonly (keyof FavoritesSearchOptions)[])[] = [
  ["sortKey", "isSortAscending"],
  ["isShuffled"],
  ["isInverted"],
  ["isBlacklistEnabled"],
  ["allowedStatuses"],
  ["allowedRatings"]
];

export function isFilteringFavoritesSearchOptions(favoritesSearchOptions: FavoritesSearchOptions): boolean {
  return FILTER_KEYS.some(key => favoritesSearchOptions[key] !== DEFAULT_FAVORITES_SEARCH_OPTIONS[key]);
}

export function isReorderingFavoritesSearchOptions(favoritesSearchOptions: Pick<FavoritesSearchOptions, (typeof ORDER_KEYS)[number]>): boolean {
  return ORDER_KEYS.some(key => favoritesSearchOptions[key] !== DEFAULT_FAVORITES_SEARCH_OPTIONS[key]);
}

export function countChangedFavoritesSearchOptions(favoritesSearchOptions: FavoritesSearchOptions): number {
  return COUNTED_KEY_GROUPS.filter(keys => keys.some(key => favoritesSearchOptions[key] !== DEFAULT_FAVORITES_SEARCH_OPTIONS[key])).length;
}
