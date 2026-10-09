import { ALL_RATINGS_MASK } from "@/core/domain/post/post";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/index";
import { SearchRequest } from "../search/inputs";
import { SearchSettings } from "@/core/features/favorites/search/inputs";
import { parseSearchExpression } from "@/core/search/parsers/search_expression_parser";

interface SearchRequestOverrides extends Partial<SearchRequest> {
  query?: string;
}

export function createSearchSettings(overrides: Partial<SearchSettings> = {}): SearchSettings {
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

export function createSearchIndex(): FavoritesSearchIndex {
  return new FavoritesSearchIndex();
}

export function searchIds(index: FavoritesSearchIndex, query = ""): string[] {
  return index.search(createSearchRequest({ query })).map(favorite => favorite.id);
}
