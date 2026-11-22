import { FavoritesBlacklist } from "@/core/features/favorites/search/favorites_blacklist";
import { FavoritesSearchOptions } from "@/core/features/favorites/search/favorites_search_options";
import { FavoritesSearchRequest } from "@/core/features/favorites/search/favorites_search_request";
import { SearchExpression } from "@/core/domain/search/expressions/search_expression";
import { parseSearchExpression } from "@/core/domain/search/parsers/search_expression_parser";

export function compileFavoritesSearchRequest(
  favoritesSearchOptions: FavoritesSearchOptions,
  favoritesBlacklist: FavoritesBlacklist
): FavoritesSearchRequest {
  const { query, isInverted, sortKey, isSortAscending, allowedRatings, allowedStatuses, isShuffled, shuffleSeed } = favoritesSearchOptions;
  const parsedSearchExpression = tryParseSearchExpression(query);
  const querySearchExpression = parsedSearchExpression !== undefined && isInverted ? SearchExpression.not(parsedSearchExpression) : parsedSearchExpression;
  const searchExpression = querySearchExpression === undefined ? undefined : favoritesBlacklist.apply(querySearchExpression, favoritesSearchOptions);
  return { searchExpression, sortKey, isSortAscending, allowedRatings, allowedStatuses, isShuffled, shuffleSeed };
}

function tryParseSearchExpression(query: string): SearchExpression | undefined {
  try {
    return parseSearchExpression(query);
  } catch {
    return undefined;
  }
}
