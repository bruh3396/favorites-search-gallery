import { SearchRequest, SearchSettings } from "@/core/features/favorites/search/inputs";
import { FavoritesBlacklist } from "@/core/features/favorites/search/blacklist";
import { SearchExpression } from "@/core/search/expressions/search_expression";
import { tryParseSearchExpression } from "@/core/search/parsers/search_expression_parser";

export function buildSearchRequest(settings: SearchSettings, blacklist: FavoritesBlacklist): SearchRequest {
  const { query, isInverted, sortKey, isSortAscending, allowedRatings, isShuffled, shuffleSeed } = settings;
  const search = tryParseSearchExpression(query);
  const matches = search !== undefined && isInverted ? SearchExpression.not(search) : search;
  const expression = matches === undefined ? undefined : blacklist.apply(matches, settings);
  return { expression, sortKey, isSortAscending, allowedRatings, isShuffled, shuffleSeed };
}
