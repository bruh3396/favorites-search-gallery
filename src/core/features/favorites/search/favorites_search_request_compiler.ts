import { FavoritesSearchRequest } from "@/core/features/favorites/search/favorites_search_request";
import { FavoritesSearchSettings } from "@/core/features/favorites/search/favorites_search_settings";
import { FavoritesBlacklist } from "@/core/features/favorites/search/favorites_blacklist";
import { SearchExpression } from "@/core/domain/search/expressions/search_expression";
import { tryParseSearchExpression } from "@/core/domain/search/parsers/search_expression_parser";

export function compileFavoritesSearchRequest(settings: FavoritesSearchSettings, blacklist: FavoritesBlacklist): FavoritesSearchRequest {
  const { query, isInverted, sortKey, isSortAscending, allowedRatings, isShuffled, shuffleSeed } = settings;
  const search = tryParseSearchExpression(query);
  const matches = search !== undefined && isInverted ? SearchExpression.not(search) : search;
  const expression = matches === undefined ? undefined : blacklist.apply(matches, settings);
  return { expression, sortKey, isSortAscending, allowedRatings, isShuffled, shuffleSeed };
}
