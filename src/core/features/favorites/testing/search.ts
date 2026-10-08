import { FavoritesSearchIndex, SearchRequest } from "@/core/features/favorites/search/index";
import { ALL_RATINGS_MASK } from "@/core/domain/post/post";
import { BitSearchEngine } from "@/core/search/engines/bit/bit_search_engine";
import { Favorite } from "@/core/features/favorites/favorite";
import { SearchSettings } from "@/core/features/favorites/search/settings";
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
  return new FavoritesSearchIndex(new BitSearchEngine<Favorite>(favorite => favorite.tags, (favorite, metric) => favorite.getMetric(metric)));
}

export function searchIds(index: FavoritesSearchIndex, query = ""): string[] {
  return index.search(createSearchRequest({ query })).map(favorite => favorite.id);
}
