import { ALL_POST_STATUSES_MASK } from "@/core/domain/post/post_status_mask";
import { ALL_RATINGS_MASK } from "@/core/domain/post/rating_mask";
import { FavoritesSearchRequest } from "@/core/features/favorites/search/favorites_search_request";
import { parseSearchExpression } from "@/core/domain/search/parsers/search_expression_parser";

interface FavoritesSearchRequestOverrides extends Partial<FavoritesSearchRequest> {
  query?: string;
}

export function buildFavoritesSearchRequest({ query = "", ...overrides }: FavoritesSearchRequestOverrides = {}): FavoritesSearchRequest {
  return {
    searchExpression: parseSearchExpression(query),
    isShuffled: false,
    shuffleSeed: 1,
    sortKey: "favorited",
    isSortAscending: false,
    allowedRatings: ALL_RATINGS_MASK,
    allowedStatuses: ALL_POST_STATUSES_MASK,
    ...overrides
  };
}
