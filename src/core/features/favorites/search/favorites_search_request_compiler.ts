import { FavoritesBlacklist } from "@/core/features/favorites/search/favorites_blacklist";
import { FavoritesSearchRequest } from "@/core/features/favorites/search/favorites_search_request";
import { FavoritesSearchSettings } from "@/core/features/favorites/search/favorites_search_settings";
import { SearchExpression } from "@/core/domain/search/expressions/search_expression";
import { parseSearchExpression } from "@/core/domain/search/parsers/search_expression_parser";

export function compileFavoritesSearchRequest(
  favoritesSearchSettings: FavoritesSearchSettings,
  favoritesBlacklist: FavoritesBlacklist
): FavoritesSearchRequest {
  const { query, isInverted, sortKey, isSortAscending, allowedRatings, allowedStatuses, isShuffled, shuffleSeed } = favoritesSearchSettings;
  const parsedSearchExpression = tryParseSearchExpression(query);
  const querySearchExpression = parsedSearchExpression !== undefined && isInverted ? SearchExpression.not(parsedSearchExpression) : parsedSearchExpression;
  const searchExpression = querySearchExpression === undefined ? undefined : favoritesBlacklist.apply(querySearchExpression, favoritesSearchSettings);
  return { searchExpression, sortKey, isSortAscending, allowedRatings, allowedStatuses, isShuffled, shuffleSeed };
}

function tryParseSearchExpression(query: string): SearchExpression | undefined {
  try {
    return parseSearchExpression(query);
  } catch {
    return undefined;
  }
}
