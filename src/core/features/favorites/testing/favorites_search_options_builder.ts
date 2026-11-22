import { ALL_POST_STATUSES_MASK } from "@/core/domain/post/post_status_mask";
import { ALL_RATINGS_MASK } from "@/core/domain/post/rating_mask";
import { FavoritesSearchSettings } from "@/core/features/favorites/search/favorites_search_settings";

export function buildFavoritesSearchSettings(partialFavoritesSearchSettings: Partial<FavoritesSearchSettings> = {}): FavoritesSearchSettings {
  return {
    query: "",
    isInverted: false,
    sortKey: "favorited",
    isSortAscending: false,
    allowedRatings: ALL_RATINGS_MASK,
    allowedStatuses: ALL_POST_STATUSES_MASK,
    isBlacklistEnabled: false,
    isShuffled: false,
    shuffleSeed: 1,
    ...partialFavoritesSearchSettings
  };
}
