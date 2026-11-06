import { describe, expect, test } from "vitest";
import { FavoritesBlacklist } from "@/core/features/favorites/search/favorites_blacklist";
import { SearchExpression } from "@/core/domain/search/expressions/search_expression";
import { buildFavoritesSearchSettings } from "@/core/features/favorites/testing/favorites_search_settings_builder";
import { compileFavoritesSearchRequest } from "@/core/features/favorites/search/favorites_search_request_compiler";
import { parseExactSearchTerm } from "@/core/domain/search/parsers/search_term_parser";
import { parseSearchExpression } from "@/core/domain/search/parsers/search_expression_parser";

const NO_BLACKLIST = new FavoritesBlacklist({ blacklistedTags: [], force: false });

describe("compileFavoritesSearchRequest", () => {
  test("copies the sort, rating, and shuffle settings", () => {
    const favoritesSearchSettings = buildFavoritesSearchSettings({
      sortKey: "score", isSortAscending: true, allowedRatings: 1, allowedStatuses: 2, isShuffled: true, shuffleSeed: 7
    });

    expect(compileFavoritesSearchRequest(favoritesSearchSettings, NO_BLACKLIST))
      .toMatchObject({ sortKey: "score", isSortAscending: true, allowedRatings: 1, allowedStatuses: 2, isShuffled: true, shuffleSeed: 7 });
  });

  test("parses the query into the expression", () => {
    expect(compileFavoritesSearchRequest(buildFavoritesSearchSettings({ query: "cat" }), NO_BLACKLIST).searchExpression).toEqual(parseSearchExpression("cat"));
  });

  test.each(["( cat", "cat ~ dog", "( )"])("returns no expression for an invalid query (%s)", query => {
    expect(compileFavoritesSearchRequest(buildFavoritesSearchSettings({ query }), NO_BLACKLIST).searchExpression).toBeUndefined();
  });

  test("negates the query when inverted", () => {
    const favoritesSearchSettings = buildFavoritesSearchSettings({ query: "cat", isInverted: true });

    expect(compileFavoritesSearchRequest(favoritesSearchSettings, NO_BLACKLIST).searchExpression).toEqual(SearchExpression.not(parseSearchExpression("cat")));
  });

  test("keeps the blacklist outside the inversion", () => {
    const favoritesBlacklist = new FavoritesBlacklist({ blacklistedTags: ["apple"], force: true });
    const favoritesSearchSettings = buildFavoritesSearchSettings({ query: "cat", isInverted: true });

    expect(compileFavoritesSearchRequest(favoritesSearchSettings, favoritesBlacklist).searchExpression)
      .toEqual(SearchExpression.and([
        SearchExpression.and([SearchExpression.not(SearchExpression.term(parseExactSearchTerm("apple")))]),
        SearchExpression.not(parseSearchExpression("cat"))
      ]));
  });
});
