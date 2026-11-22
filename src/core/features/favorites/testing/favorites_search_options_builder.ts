import { ALL_POST_STATUSES_MASK } from "@/core/domain/post/post_status_mask";
import { ALL_RATINGS_MASK } from "@/core/domain/post/rating_mask";
import { FavoritesSearchOptions } from "@/core/features/favorites/search/favorites_search_options";

export function buildFavoritesSearchOptions(partialFavoritesSearchOptions: Partial<FavoritesSearchOptions> = {}): FavoritesSearchOptions {
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
    ...partialFavoritesSearchOptions
  };
}
