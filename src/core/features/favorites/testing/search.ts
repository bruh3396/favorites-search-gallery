import { FavoritesSearchRequest, FavoritesSearchSettings } from "@/core/features/favorites/search/input";
import { ALL_RATINGS_MASK } from "@/core/domain/post/post";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/index";
import { parseSearchExpression } from "@/core/domain/search/parsers/search_expression_parser";

interface SearchRequestOverrides extends Partial<FavoritesSearchRequest> {
  query?: string;
}

export function createSearchSettings(overrides: Partial<FavoritesSearchSettings> = {}): FavoritesSearchSettings {
  return {
    query: "",
    isInverted: false,
    sortKey: "favorited",
    isSortAscending: false,
    allowedRatings: ALL_RATINGS_MASK,
    isBlacklistEnabled: false,
    isShuffled: false,
    shuffleSeed: 1,
    ...overrides
  };
}

export function createSearchRequest({ query = "", ...overrides }: SearchRequestOverrides = {}): FavoritesSearchRequest {
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

export function createSearchIndex(): FavoritesSearchIndex {
  return new FavoritesSearchIndex();
}

export function searchIds(index: FavoritesSearchIndex, query = ""): string[] {
  return index.search(createSearchRequest({ query })).map(favorite => favorite.id);
}
