import { SearchRequest, SearchSettings } from "@/core/features/favorites/types/search";
import { ALL_RATINGS_MASK } from "@/core/domain/post/post";
import { parseSearchExpression } from "@/core/search/parsers/search_expression_parser";

interface SearchRequestOverrides extends Partial<SearchRequest> {
  query?: string;
}

export function createSearchSettings(overrides: Partial<SearchSettings> = {}): SearchSettings {
  return {
    sortKey: "favorited",
    isSortAscending: false,
    allowedRatings: ALL_RATINGS_MASK,
    isBlacklistEnabled: false,
    ...overrides
  };
}

export function createSearchRequest({ query = "", ...overrides }: SearchRequestOverrides = {}): SearchRequest {
  return {
    expression: parseSearchExpression(query),
    isShuffled: false,
    shuffleSeed: 1,
    sortKey: "favorited",
    isSortAscending: false,
    allowedRatings: ALL_RATINGS_MASK,
    ...overrides
  };
}
